
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TitleInputPage from '@/pages/TitleInputPage';
import PageReviewPage from '@/pages/PageReviewPage';
import ContentGenerationPage from '@/pages/ContentGenerationPage';

const ComicGenerator = () => {
  return (
    <Routes>
      <Route index element={<TitleInputPage />} />
      <Route path="/page-review" element={<PageReviewPage />} />
      <Route path="/content-generation" element={<ContentGenerationPage />} />
    </Routes>
  );
};

export default ComicGenerator;
