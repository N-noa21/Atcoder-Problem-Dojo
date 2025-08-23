// src/Data/problemStore.ts

import { create } from 'zustand';
import axios from 'axios';

// Problemの型定義
export interface Problem {
  id: string;
  contest_id: string;
  title: string;
  difficulty?: number; // `?` をつけてオプショナルにしておく
  solveCount?: number;
  lastSolved?: number;
}

// ストアで管理する状態とアクションの型
interface ProblemState {
  problems: Problem[];
  isLoading: boolean;
  fetchAndMergeProblems: (atcoderId: string) => Promise<void>;
}

export const useProblemStore = create<ProblemState>((set) => ({
  problems: [],
  isLoading: false,
  fetchAndMergeProblems: async (atcoderId) => {
    set({ isLoading: true });

    try {
      // --- 1. 必要なデータを並行して取得 ---
      const [problemResponse, difficultyResponse] = await Promise.all([
        axios.get('https://kenkoooo.com/atcoder/resources/merged-problems.json'),
        axios.get('https://kenkoooo.com/atcoder/resources/problem-models.json'),
      ]);

      const allProblems: Problem[] = problemResponse.data;
      const difficultyModels: Record<string, { difficulty?: number }> = difficultyResponse.data;

      // --- 2. 問題リストに難易度情報をマージ ---
      const problemsWithDifficulty = allProblems.map(problem => ({
        ...problem,
        difficulty: difficultyModels[problem.id]?.difficulty,
      }));

      // --- 3. ユーザーの全提出履歴をループで取得 ---
      let allSubmissions: any[] = [];
      let lastTimestamp = 0;
      while (true) {
        const res = await axios.get(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${atcoderId}&from_second=${lastTimestamp}`);
        if (res.data.length === 0) {
          break;
        }
        allSubmissions = allSubmissions.concat(res.data);
        lastTimestamp = res.data[res.data.length - 1].epoch_second + 1;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // --- 4. 提出履歴を加工 ---
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

      // --- 5. 最終的なデータを結合 ---
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
