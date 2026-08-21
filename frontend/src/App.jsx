import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { Toaster } from 'react-hot-toast'

import {useAuthContext} from './hooks/useAuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
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
          <Route path='/'          element = { user  ? <Home/>   : <Navigate to = "/login" />}/>
          <Route path='/login'     element = { !user ? <Login/>  : <Navigate to = "/"      />}/>
          <Route path='/signup'    element = { !user ? <Signup/> : <Navigate to = "/"      />}/>

          <Route path='/admin'      element = {user && user.role === 'Admin' ? <AdminDashboard/> : <Navigate to="/" />}/>
          <Route path='/audit-logs' element = {user && (user.role === 'Admin' || user.role === 'Security') ? <AuditLogs/> : <Navigate to="/" />}/>
        </Routes>
      </BrowserRouter>
    </div>
  )
}
export default App