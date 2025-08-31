import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { auth, db } from './Data/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useUserStore } from './Data/userStore';
import { Header } from './components/Header';
import { Box, CircularProgress } from '@mui/material';
import { AtcoderIdPrompt } from './components/AtcoderIdPrompt';
import { SearchPage } from './Page/SearchPage';
import { ProblemListPage } from './Page/ProblemListPage';

const AppLayout = () => {
  const { currentUser, setUser, isLoading, atcoderId, setAtcoderId } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists() && docSnap.data().atcoderId) {
            setAtcoderId(docSnap.data().atcoderId);
          } else {
            setAtcoderId(null);
          }
        } else {
          setAtcoderId(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setAtcoderId(null);
      } finally {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, [setUser, setAtcoderId]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (currentUser && !atcoderId) {
    return <AtcoderIdPrompt />;
  }

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<SearchPage />} />
          <Route path="/problems" element={<ProblemListPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
    