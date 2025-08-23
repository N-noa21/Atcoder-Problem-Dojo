// src/App.tsx
import { useEffect, type ReactNode } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useUserStore } from './Data/userStore';
import { Header } from './components/Header';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AtcoderIdPrompt } from './components/AtcoderIdPrompt';

interface AppProps {
  children: ReactNode;
}

function App({ children }: AppProps) {
  const { currentUser, setUser, isLoading, atcoderId, setAtcoderId } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // ユーザーがログインしている場合、Firestoreからプロフィール情報を取得
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists() && docSnap.data().atcoderId) {
            setAtcoderId(docSnap.data().atcoderId);
          } else {
            setAtcoderId(null);
          }
        } else {
          // ログアウトした場合
          setAtcoderId(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // エラーが発生しても、認証状態は更新する
        setAtcoderId(null);
      } finally {
        // --- 成功・失敗にかかわらず、必ずユーザー状態を更新し、ローディングを終了させる ---
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [setUser, setAtcoderId]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Checking authentication...</Typography>
      </Box>
    );
  }

  if (currentUser && !atcoderId) {
    return <AtcoderIdPrompt />;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}

export default App;
