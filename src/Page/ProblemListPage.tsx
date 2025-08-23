// src/pages/ProblemListPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProblemStore } from '../Data/problemStore';
import { Box, Card, CardContent, CardActions, Button, Typography, Pagination, CircularProgress, Link, Container } from '@mui/material';

export const ProblemListPage = () => {
  const { problems, isLoading, fetchAndMergeProblems } = useProblemStore();
  
  const [searchParams] = useSearchParams();
  const minDiff = parseInt(searchParams.get('min') || '0', 10);
  const maxDiff = parseInt(searchParams.get('max') || '8000', 10);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20; // カード形式にしたので1ページの表示件数を調整

  useEffect(() => {
    if (problems.length === 0) {
      fetchAndMergeProblems('N_noa21');
    }
  }, [fetchAndMergeProblems, problems.length]);

  const filteredAndSortedProblems = useMemo(() => {
    return problems
      .filter(p => {
        if (p.difficulty === undefined) return false;
        return p.difficulty >= minDiff && p.difficulty <= maxDiff;
      })
      .sort((a, b) => {
        const solveCountDiff = (a.solveCount || 0) - (b.solveCount || 0);
        if (solveCountDiff !== 0) return solveCountDiff;
        return (a.lastSolved || 0) - (b.lastSolved || 0);
      });
  }, [problems, minDiff, maxDiff]);

  const pageCount = Math.ceil(filteredAndSortedProblems.length / ITEMS_PER_PAGE);
  const currentProblems = filteredAndSortedProblems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0); // ページ切り替え時に画面上部へスクロール
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading and merging data...</Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Problems (Difficulty: {minDiff} - {maxDiff})
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {filteredAndSortedProblems.length} problems found.
      </Typography>
      
      {/* --- カードリスト (GridをBoxに変更) --- */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {currentProblems.map((problem) => (
          <Card variant="outlined" key={problem.id}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
              <CardContent sx={{ flexGrow: 1, width: '100%' }}>
                <Typography variant="h6" component="div">
                  {problem.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Difficulty: {problem.difficulty} / Solved: {problem.solveCount || 0} times
                </Typography>
                {/* --- 最終解答日を追加 --- */}
                <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                  Last Solved: {problem.lastSolved 
                    ? new Date(problem.lastSolved * 1000).toLocaleString('ja-JP') 
                    : 'N/A'}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                <Button
                  variant="contained"
                  component={Link}
                  href={`https://atcoder.jp/contests/${problem.contest_id}/tasks/${problem.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Problem
                </Button>
              </CardActions>
            </Box>
          </Card>
        ))}
      </Box>
      
      {/* --- ページネーション --- */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={pageCount}
          page={page}
          onChange={handlePageChange}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>
    </Container>
  );
};
