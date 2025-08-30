// src/components/Header.tsx
import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // Linkをインポート
import { useUserStore } from '../Data/userStore';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { AuthModal } from './AuthModal';

export const Header = () => {
  const { currentUser } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('ログアウトしました');
    } catch (error) {
      console.error('ログアウトエラー', error);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink} // Typographyをリンクとして機能させる
            to="/" // クリック時の遷移先を検索ページに設定
            sx={{
              flexGrow: 1,
              color: 'inherit', // 親要素の色を継承
              textDecoration: 'none', // 下線を消す
            }}
          >
            Atcoder Problem Dojo
          </Typography>

          {currentUser ? (
            // --- ログインしている時の表示 ---
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {currentUser.email?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography>{currentUser.email}</Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          ) : (
            // --- ログインしていない時の表示 ---
            <Button color="inherit" onClick={() => setIsModalOpen(true)}>
              Login / Sign Up
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* --- 認証モーダル --- */}
      <AuthModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
