import { useState } from 'react';
import { Box, Typography, TextField, Button, Container, Paper, Alert } from '@mui/material';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useUserStore } from '../Data/userStore';

export const AtcoderIdPrompt = () => {
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  const { setAtcoderId } = useUserStore();
  const user = auth.currentUser;

  const handleSubmit = async () => {
    if (!id.trim()) {
      setError('AtCoder IDを入力してください。');
      return;
    }
    if (!user) {
      setError('ユーザー情報が見つかりません。再度ログインしてください。');
      return;
    }
    setError('');

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { atcoderId: id }, { merge: true });

      setAtcoderId(id);
      
    } catch (err) {
      console.error(err);
      setError('IDの保存中にエラーが発生しました。');
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          AtCoder IDの連携
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, mb: 3 }} align="center">
          問題の解答状況を取得するために、あなたのAtCoder IDを入力してください。
        </Typography>
        <Box component="form" sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="AtCoder ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            fullWidth
            autoFocus
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            type="button"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleSubmit}
          >
            保存して続ける
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
