import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { Toaster } from 'react-hot-toast'

import {useAuthContext} from './hooks/useAuthContext'
import Login from './pages/Login'
import PublicPortal from './pages/PublicPortal'
import Navbar from './components/Navbar'
import Signup from './pages/Signup'
import AdminDashboard from './pages/AdminDashboard'
import AuditLogs from './pages/AuditLogs'

function App() {
  const {user} = useAuthContext()
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <BrowserRouter>
        <Navbar />
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public Visitor Registration Landing Page */}
          <Route path='/' element={<PublicPortal />} />

          {/* Auth Routes */}
          <Route path='/login'  element={!user ? <Login /> : <Navigate to="/admin" />} />
          <Route path='/signup' element={!user ? <Signup /> : <Navigate to="/admin" />} />

          {/* Protected Security & Administration Hub */}
          <Route 
            path='/admin' 
            element={user && (user.role === 'Admin' || user.role === 'Security') ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path='/audit-logs' 
            element={user && (user.role === 'Admin' || user.role === 'Security') ? <AuditLogs /> : <Navigate to="/login" />} 
          />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
export default App