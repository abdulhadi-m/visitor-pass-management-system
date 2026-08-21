import { useState } from "react"
import { Link } from "react-router-dom"
import { useSignup } from '../hooks/useSignup'

const Signup = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [role, setRole] = useState('Employee')
    const { signup, error, isLoading } = useSignup()

    const handleSubmit = async (e) => {
        e.preventDefault()
        await signup(email, name, role, password)
    }

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-slate-50">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create an Account</h2>
                    <p className="text-sm text-gray-500 mt-1">Get started with VPMS Visitor Security</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Full Name
                        </label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="e.g. John Doe"
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Account Role
                        </label>
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                        >
                            <option value="Admin">Admin (Host)</option>
                            <option value="Security">Security Guard</option>
                            <option value="Employee">Standard Employee</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="name@company.com"
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
                            {error}
                        </div>
                    )}
                </form>

                <p className="text-center text-xs text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Signup