// src/Data/problemStore.ts

import { create } from 'zustand';
import axios from 'axios';

// --- ステータスオプションを定義・エクスポート ---
export const STATUS_OPTIONS = {
  'No Try': { label: 'No Try', color: 'text.secondary', backgroundColor: 'transparent' },
  // --- 背景色を、より薄いHEXコードに変更 ---
  'Kaiseki AC': { label: '解説AC', color: 'info.main', backgroundColor: '#e3f2fd' }, // ごく薄い青
  'AC': { label: 'AC', color: 'success.main', backgroundColor: '#e8f5e9' }, // ごく薄い緑
  'AC_within_20m': { label: 'AC(within 20m)', color: 'warning.main', backgroundColor: '#fffde7' }, // ごく薄い黄
} as const;

// Problemの型定義
export interface Problem {
  id: string;
  contest_id: string;
  title: string;
  difficulty?: number;
  solveCount?: number;
  lastSolved?: number;
  status?: keyof typeof STATUS_OPTIONS;
}

// ストアの型定義
interface ProblemState {
  problems: Problem[];
  isLoading: boolean;
  fetchAndMergeProblems: (atcoderId: string) => Promise<void>;
  updateProblemStatus: (problemId: string, newStatus: string) => void;
}

export const useProblemStore = create<ProblemState>((set, get) => ({
  problems: [],
  isLoading: false,
  
  updateProblemStatus: (problemId, newStatus) => {
    set({
      problems: get().problems.map(problem => 
        problem.id === problemId 
          ? { ...problem, status: newStatus as keyof typeof STATUS_OPTIONS } 
          : problem
      ),
    });
  },

  fetchAndMergeProblems: async (atcoderId) => {
    set({ isLoading: true });

    try {
      const [problemResponse, difficultyResponse] = await Promise.all([
        axios.get('https://kenkoooo.com/atcoder/resources/merged-problems.json'),
        axios.get('https://kenkoooo.com/atcoder/resources/problem-models.json'),
      ]);

      const allProblems: Problem[] = problemResponse.data;
      const difficultyModels: Record<string, { difficulty?: number }> = difficultyResponse.data;

      const problemsWithDifficulty = allProblems.map(problem => ({
        ...problem,
        difficulty: difficultyModels[problem.id]?.difficulty,
      }));

      let allSubmissions: any[] = [];
      let lastTimestamp = 0;
      while (true) {
        const res = await axios.get(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${atcoderId}&from_second=${lastTimestamp}`);
        if (res.data.length === 0) break;
        
        allSubmissions = allSubmissions.concat(res.data);
        lastTimestamp = res.data[res.data.length - 1].epoch_second + 1;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const submissionMap = new Map<string, { solveCount: number; lastSolved: number }>();
      allSubmissions
        .filter(sub => sub.result === 'AC')
        .forEach(sub => {
          const current = submissionMap.get(sub.problem_id);
          submissionMap.set(sub.problem_id, {
            solveCount: (current?.solveCount || 0) + 1,
            lastSolved: Math.max(current?.lastSolved || 0, sub.epoch_second),
          });
        });

      const finalMergedProblems = problemsWithDifficulty.map(problem => {
        const submissionData = submissionMap.get(problem.id);
        return {
          ...problem,
          solveCount: submissionData?.solveCount || 0,
          lastSolved: submissionData?.lastSolved,
        };
      });

      set({ problems: finalMergedProblems });

    } catch (error) {
      console.error("Failed to fetch and merge problems", error);
      set({ problems: [] });
    } finally {
      set({ isLoading: false });
    }
  },
}));
