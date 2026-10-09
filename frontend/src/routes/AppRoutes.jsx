import React, { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

const LoginPage = lazy(() => import('../pages/LoginPage'))

export default function AppRoutes() {
  return <Suspense fallback={<div className="route-loading"><span className="spinner" />Loading your workspace…</div>}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Suspense>
}
