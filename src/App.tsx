import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ModelsPage } from './pages/ModelsPage'
import { ReservePage } from './pages/ReservePage'
import { ShowroomsPage } from './pages/ShowroomsPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { PrivacyPage } from './pages/PrivacyPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="modeles" element={<ModelsPage />} />
          <Route path="reserver" element={<ReservePage />} />
          <Route path="showrooms" element={<ShowroomsPage />} />
          <Route path="avis" element={<ReviewsPage />} />
          <Route path="confidentialite" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
