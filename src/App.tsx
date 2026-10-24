import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ModelsPage } from './pages/ModelsPage'
import { ReservePage } from './pages/ReservePage'
import { ShowroomsPage } from './pages/ShowroomsPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { DevisPage } from './pages/DevisPage'
import { VisitPage } from './pages/VisitPage'
import { AfterSalesPage } from './pages/AfterSalesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="modeles" element={<ModelsPage />} />
          <Route path="devis" element={<DevisPage />} />
          <Route path="visite" element={<VisitPage />} />
          <Route path="reserver" element={<ReservePage />} />
          <Route path="apres-vente" element={<AfterSalesPage />} />
          <Route path="showrooms" element={<ShowroomsPage />} />
          <Route path="avis" element={<ReviewsPage />} />
          <Route path="confidentialite" element={<PrivacyPage />} />
          <Route path="demo" element={<Navigate to="/devis" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
