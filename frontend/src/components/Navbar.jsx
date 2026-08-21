import React from 'react'
import { Link } from 'react-router-dom'
import { useLogout } from '../hooks/useLogout'
import { useAuthContext } from '../hooks/useAuthContext'

function Navbar() {
    const { user } = useAuthContext()
    const { logout } = useLogout()

    const handleClick = () => {
        logout()
    }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-3.5 flex justify-between items-center">
            
            {/* The Logo Area */}
            <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-xs shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                    VPMS
                </span>
            </Link>
            
            <nav className="flex items-center gap-5 font-medium text-slate-600">
                {user && user.role === 'Admin' && (
                    <Link 
                        to="/admin" 
                        className="text-sm text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100/80"
                    >
                        Admin Portal
                    </Link>
                )}

                {user && (user.role === 'Admin' || user.role === 'Security') && (
                    <Link 
                        to="/audit-logs" 
                        className="text-sm text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100/80"
                    >
                        Audit Logs
                    </Link>
                )}

                {user && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/80 hover:border-slate-300 transition-colors">
                      <div className="bg-slate-800 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs shadow-xs">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-800 font-medium pr-1.5">{user.email.split('@')[0]}</span>
                    </div>
                    
                    <button 
                      onClick={handleClick}
                      className="text-sm border border-rose-200 text-rose-600 hover:bg-rose-50 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                )}
                {!user && (
                  <div className="flex items-center gap-3">
                    <Link to="/login" className="text-slate-600 hover:text-blue-600 transition-colors text-sm px-3 py-1.5">
                      Login
                    </Link>
                    <Link to="/signup" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-xs">
                      Sign Up
                    </Link>
                  </div>
                )}
            </nav>
        </div>
    </header>
  )
}

export default Navbar