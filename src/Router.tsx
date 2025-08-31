import { Routes, Route } from 'react-router-dom';
import { SearchPage } from './Page/SearchPage';
import { ProblemListPage } from './Page/ProblemListPage';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/problems" element={<ProblemListPage />} />
      {/* 他にページが増えたら、ここに追加していく */}
    </Routes>
  );
};