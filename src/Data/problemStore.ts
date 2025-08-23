// src/Data/problemStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { db, auth } from '../firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

// STATUS_OPTIONSの定義は変更なし
export const STATUS_OPTIONS = {
  'No Try': { label: 'No Try', color: 'text.secondary', backgroundColor: '#fafafa' },
  'Kaiseki AC': { label: '解説AC', color: 'info.main', backgroundColor: '#e3f2fd' },
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
}

// --- APIから取得する提出データの型を定義 ---
interface Submission {
  epoch_second: number;
  problem_id: string;
  result: string;
  // 他にも多くのプロパティがありますが、使用するものだけ定義すれば十分です
}

interface ProblemState {
  problems: Problem[];
  isLoading: boolean;
  fetchAndMergeProblems: (atcoderId: string) => Promise<void>;
  updateProblemStatus: (problemId: string, newStatus: string) => Promise<void>;
}

export const useProblemStore = create<ProblemState>((set, get) => ({
  problems: [],
  isLoading: false,
  
  updateProblemStatus: async (problemId, newStatus) => {
    const user = auth.currentUser;
    if (!user) {
      console.log("User not logged in. Status not saved.");
      set({
        problems: get().problems.map(p => p.id === problemId ? { ...p, status: newStatus as keyof typeof STATUS_OPTIONS } : p),
      });
      return;
    }

    try {
      const statusRef = doc(db, 'users', user.uid, 'statuses', problemId);
      await setDoc(statusRef, { status: newStatus });
      console.log(`Status for ${problemId} saved to Firebase.`);
    } catch (error) {
      console.error("Failed to update status in Firebase:", error);
    }

    set({
      problems: get().problems.map(p => p.id === problemId ? { ...p, status: newStatus as keyof typeof STATUS_OPTIONS } : p),
    });
  },

  fetchAndMergeProblems: async (atcoderId) => {
    set({ isLoading: true });
    const user = auth.currentUser;

    try {
      const savedStatuses = new Map<string, keyof typeof STATUS_OPTIONS>();
      if (user) {
        const statusesSnapshot = await getDocs(collection(db, 'users', user.uid, 'statuses'));
        statusesSnapshot.forEach(doc => {
          savedStatuses.set(doc.id, doc.data().status);
        });
        console.log(`Loaded ${savedStatuses.size} statuses from Firebase.`);
      }

      const [problemResponse, difficultyResponse] = await Promise.all([
        axios.get('https://kenkoooo.com/atcoder/resources/merged-problems.json'),
        axios.get('https://kenkoooo.com/atcoder/resources/problem-models.json'),
      ]);
      const allProblems: Problem[] = problemResponse.data;
      const difficultyModels: Record<string, { difficulty?: number }> = difficultyResponse.data;
      const problemsWithDifficulty = allProblems.map(p => ({ ...p, difficulty: difficultyModels[p.id]?.difficulty }));

      // --- 'any[]'を'Submission[]'に修正 ---
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
        };
      });

      set({ problems: finalMergedProblems });

    } catch (error) {
      console.error("Failed to fetch and merge problems", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
