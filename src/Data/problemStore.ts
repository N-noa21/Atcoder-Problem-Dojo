import { create } from 'zustand';
import axios from 'axios';
import { db, auth } from './firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

export const STATUS_OPTIONS = {
  'No Try': { label: 'No Try', color: 'text.secondary', backgroundColor: '#fafafa' },
  'Kaisetu AC': { label: '解説AC', color: 'info.main', backgroundColor: '#e3f2fd' },
  'AC': { label: 'AC', color: 'success.main', backgroundColor: '#e8f5e9' },
  'AC_within_20m': { label: 'AC(within 20m)', color: 'warning.main', backgroundColor: '#fffde7' },
} as const;

export interface Problem {
  id: string;
  contest_id: string;
  title: string;
  difficulty?: number;
  solveCount?: number;
  lastSolved?: number;
  status?: keyof typeof STATUS_OPTIONS;
  memo?: string; // 👈 'memo'プロパティを追加
}

interface Submission {
  epoch_second: number;
  problem_id: string;
  result: string;
}

interface ProblemState {
  problems: Problem[];
  isLoading: boolean;
  error: string | null;
  fetchAndMergeProblems: (atcoderId: string) => Promise<void>;
  updateProblemStatus: (problemId: string, newStatus: string) => Promise<void>;
  updateProblemMemo: (problemId: string, memo: string) => Promise<void>; // 👈 'updateProblemMemo'アクションを追加
}

export const useProblemStore = create<ProblemState>((set, get) => ({
  problems: [],
  isLoading: false,
  error: null,
  
  updateProblemStatus: async (problemId, newStatus) => {
    const user = auth.currentUser;
    const problems = get().problems;
    const updatedProblems = problems.map(p => p.id === problemId ? { ...p, status: newStatus as keyof typeof STATUS_OPTIONS } : p);
    set({ problems: updatedProblems });

    if (!user) return;
    try {
      const statusRef = doc(db, 'users', user.uid, 'statuses', problemId);
      await setDoc(statusRef, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status in Firebase:", error);
    }
  },

  // --- 'updateProblemMemo'の実装を追加 ---
  updateProblemMemo: async (problemId, memo) => {
    const user = auth.currentUser;
    const problems = get().problems;
    const updatedProblems = problems.map(p => p.id === problemId ? { ...p, memo } : p);
    set({ problems: updatedProblems });

    if (!user) return;
    try {
      const memoRef = doc(db, 'users', user.uid, 'memos', problemId);
      await setDoc(memoRef, { memo });
    } catch (error) {
      console.error("Failed to update memo in Firebase:", error);
    }
  },

  fetchAndMergeProblems: async (atcoderId) => {
    set({ isLoading: true, error: null });
    const user = auth.currentUser;

    try {
      const savedStatuses = new Map<string, keyof typeof STATUS_OPTIONS>();
      const savedMemos = new Map<string, string>(); // メモ用のMapを追加

      if (user) {
        const statusesSnapshot = await getDocs(collection(db, 'users', user.uid, 'statuses'));
        statusesSnapshot.forEach(doc => savedStatuses.set(doc.id, doc.data().status));
        
        // Firestoreからメモを取得する処理を追加
        const memosSnapshot = await getDocs(collection(db, 'users', user.uid, 'memos'));
        memosSnapshot.forEach(doc => savedMemos.set(doc.id, doc.data().memo));
      }

      const [problemResponse, difficultyResponse] = await Promise.all([
        axios.get('https://kenkoooo.com/atcoder/resources/merged-problems.json'),
        axios.get('https://kenkoooo.com/atcoder/resources/problem-models.json'),
      ]);
      const allProblems: Problem[] = problemResponse.data;
      const difficultyModels: Record<string, { difficulty?: number }> = difficultyResponse.data;
      const problemsWithDifficulty = allProblems.map(p => ({ ...p, difficulty: difficultyModels[p.id]?.difficulty }));

      let allSubmissions: Submission[] = [];
      let lastTimestamp = 0;
      while (true) {
        const res = await axios.get(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${atcoderId}&from_second=${lastTimestamp}`);
        if (res.data.length === 0) break;
        allSubmissions = allSubmissions.concat(res.data);
        lastTimestamp = res.data[res.data.length - 1].epoch_second + 1;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const submissionMap = new Map<string, { solveCount: number; lastSolved: number }>();
      allSubmissions.filter(s => s.result === 'AC').forEach(s => {
        const current = submissionMap.get(s.problem_id);
        submissionMap.set(s.problem_id, {
          solveCount: (current?.solveCount || 0) + 1,
          lastSolved: Math.max(current?.lastSolved || 0, s.epoch_second),
        });
      });

      const finalMergedProblems = problemsWithDifficulty.map(problem => {
        const submissionData = submissionMap.get(problem.id);
        return {
          ...problem,
          solveCount: submissionData?.solveCount || 0,
          lastSolved: submissionData?.lastSolved,
          status: savedStatuses.get(problem.id) || 'No Try',
          memo: savedMemos.get(problem.id) || '', // 取得したメモをマージ
        };
      });
      set({ problems: finalMergedProblems });

    } catch (err) {
      console.error("Failed to fetch and merge problems", err);
      let errorMessage = 'データの取得中に不明なエラーが発生しました。';
      if (err instanceof FirebaseError && err.code === 'permission-denied') {
        errorMessage = 'データベースへのアクセスが拒否されました。Firebaseのセキュリティルールを更新してください。';
      }
      set({ problems: [], error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
}));
