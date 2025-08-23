// src/pages/SearchPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography } from '@mui/material';

export const SearchPage = () => {
  const [minDiff, setMinDiff] = useState('400');
  const [maxDiff, setMaxDiff] = useState('800');
  const navigate = useNavigate();

  const handleSearch = () => {
    // 入力値を使ってURLを組み立てて、問題一覧ページに遷移
    navigate(`/problems?min=${minDiff}&max=${maxDiff}`);
  };

  return (
    <Box sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Search Problems by Difficulty
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          label="Min Difficulty"
          type="number"
          value={minDiff}
          onChange={(e) => setMinDiff(e.target.value)}
        />
        <Typography>〜</Typography>
        <TextField
          label="Max Difficulty"
          type="number"
          value={maxDiff}
          onChange={(e) => setMaxDiff(e.target.value)}
        />
      </Box>
      <Button variant="contained" onClick={handleSearch} sx={{ marginTop: 2 }}>
        Search
      </Button>
    </Box>
  );
};