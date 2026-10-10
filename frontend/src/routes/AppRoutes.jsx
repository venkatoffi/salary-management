import React, { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { can, roleIs } from '../utils/permissions'

const LoginPage = lazy(() => import('../pages/LoginPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const EmployeesPage = lazy(() => import('../pages/EmployeePages').then((module) => ({ default: module.EmployeesPage })))
const EmployeeDetailsPage = lazy(() => import('../pages/EmployeePages').then((module) => ({ default: module.EmployeeDetailsPage })))
const DepartmentsPage = lazy(() => import('../pages/DepartmentPages').then((module) => ({ default: module.DepartmentsPage })))
const DepartmentDetailsPage = lazy(() => import('../pages/DepartmentPages').then((module) => ({ default: module.DepartmentDetailsPage })))
const SalariesPage = lazy(() => import('../pages/SalaryPages').then((module) => ({ default: module.SalariesPage })))
const SalaryDetailsPage = lazy(() => import('../pages/SalaryPages').then((module) => ({ default: module.SalaryDetailsPage })))
const SalaryFormPage = lazy(() => import('../pages/SalaryPages').then((module) => ({ default: module.SalaryFormPage })))
const SalaryRevisionsPage = lazy(() => import('../pages/SalaryRevisionsPage').then((module) => ({ default: module.SalaryRevisionsPage })))
const PayslipsPage = lazy(() => import('../pages/PayslipPages').then((module) => ({ default: module.PayslipsPage })))
const PayslipDetailsPage = lazy(() => import('../pages/PayslipPages').then((module) => ({ default: module.PayslipDetailsPage })))
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const UnauthorizedPage = lazy(() => import('../pages/StatusPages').then((module) => ({ default: module.UnauthorizedPage })))
const NotFoundPage = lazy(() => import('../pages/StatusPages').then((module) => ({ default: module.NotFoundPage })))

function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <div className="route-loading"><span className="spinner" />Restoring your workspace…</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequirePermission({ resource, action = 'read' }) {
  const { user } = useAuth()
  return can(user, resource, action) ? <Outlet /> : <UnauthorizedPage />
}

function RequirePeopleAdmin() {
  const { user } = useAuth()
  return roleIs(user, 'Chiefs', 'HR Manager') ? <Outlet /> : <UnauthorizedPage />
}

export default function AppRoutes() {
  return <Suspense fallback={<div className="route-loading"><span className="spinner" />Loading your workspace…</div>}><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<RequireAuth />}>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="employees" element={<RequirePermission resource="employees" />}><Route index element={<EmployeesPage />} /><Route path=":id" element={<EmployeeDetailsPage />} /></Route>
        <Route path="departments" element={<RequirePeopleAdmin />}><Route index element={<DepartmentsPage />} /><Route path=":id" element={<DepartmentDetailsPage />} /></Route>
        <Route path="salaries" element={<RequirePermission resource="salaries" />}><Route index element={<SalariesPage />} /><Route path="new" element={<RequirePermission resource="salaries" action="manage" />}><Route index element={<SalaryFormPage />} /></Route><Route path=":id" element={<SalaryDetailsPage />} /><Route path=":id/edit" element={<RequirePermission resource="salaries" action="manage" />}><Route index element={<SalaryFormPage />} /></Route></Route>
        <Route path="salary-revisions" element={<RequirePermission resource="salary_revisions" />}><Route index element={<SalaryRevisionsPage />} /></Route>
        <Route path="payslips" element={<RequirePermission resource="payslips" />}><Route index element={<PayslipsPage />} /><Route path=":id" element={<PayslipDetailsPage />} /></Route>
        <Route path="profile" element={<ProfilePage />} />
        <Route path="unauthorized" element={<UnauthorizedPage />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense>
}
