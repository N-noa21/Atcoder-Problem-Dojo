// src/App.tsx

import { ReactNode } from 'react';
// import { useUserStore } from './store/userStore'; // useEffectなどは必要に応じて残す
// import { useEffect } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from './firebase';

// childrenを受け取るように型定義を変更
interface AppProps {
  children: ReactNode;
}

function App({ children }: AppProps) {
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     // ... ユーザー状態の監視ロジック ...
  //   });
  //   return () => unsubscribe();
  // }, []);

  return (
    <>
      <main>{children}</main>
    </>
  );
}

export default App;