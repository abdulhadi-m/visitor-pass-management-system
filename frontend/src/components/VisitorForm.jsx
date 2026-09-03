import React, { useState } from 'react'
import { useCreateVisitor } from '../hooks/useCreateVisitor'
import toast from 'react-hot-toast'

function VisitorForm({ 
    onSuccess, 
    formData = { startTime: '' }, 
    setFormData,
    appointmentDetails = { startTime: '' },
    setAppointmentDetails 
}) {
    const [name, setName] = useState(formData?.name || '')
    const [email, setEmail] = useState(formData?.email || '')
    const [phone, setPhone] = useState(formData?.phone || '')
    const [purpose, setPurpose] = useState(formData?.purpose || '')
    const [hostName, setHostName] = useState(formData?.hostName || appointmentDetails?.hostName || '')
    const [startTime, setStartTime] = useState(formData?.startTime || appointmentDetails?.startTime || '')
    const [photo, setPhoto] = useState(null)

    const { createVisitor, isLoading, error } = useCreateVisitor()

    const handleSubmit = async (e) => {
        e.preventDefault()
        const result = await createVisitor(name, email, phone, purpose, photo, hostName)

        if (result.success) {
            toast.success('Visitor pass requested! Pending Host/Admin approval.') 
            setName('')
            setEmail('')
            setPhone('')
            setPurpose('')
            setHostName('')
            setStartTime('')
            setPhoto(null)
                
            const fileInput = document.getElementById('photo-upload')
            if (fileInput) fileInput.value = ''
            
            if (onSuccess) {
                onSuccess({
                    ...result.data,
                    name,
                    email,
                    phone,
                    purpose,
                    hostName,
                    startTime: startTime || formData?.startTime || appointmentDetails?.startTime || '',
                    appointmentDetails: {
                        startTime: startTime || formData?.startTime || appointmentDetails?.startTime || '',
                        hostName,
                        purpose
                    }
                })
            }
        } else {
            toast.error(error || 'Failed to register visitor') 
        }
    }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="pb-3 border-b border-gray-100">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">Register New Visitor</h3>
            <p className="text-xs text-gray-500 mt-0.5">Enter details to initiate pass registration</p>
        </div>

        <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name
            </label>
            <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            />
        </div>

        <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
            </label>
            <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="visitor@example.com"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            />
        </div>

        <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Phone Number
            </label>
            <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            />
        </div>

        <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Purpose of Visit
            </label>
            <select 
                value={purpose} 
                onChange={(e) => setPurpose(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
            >
                <option value="" disabled>Select purpose of visit</option>
                <option value="Business Meeting">Business Meeting</option>
                <option value="Job Interview">Job Interview</option>
                <option value="Client / Customer Visit">Client / Customer Visit</option>
                <option value="Vendor / Supplier">Vendor / Supplier</option>
                <option value="Maintenance & Repair">Maintenance & Repair</option>
                <option value="Delivery / Courier">Delivery / Courier</option>
                <option value="Contractor / Technical Service">Contractor / Technical Service</option>
                <option value="Official Audit / Inspection">Official Audit / Inspection</option>
                <option value="Personal / Guest Visit">Personal / Guest Visit</option>
                <option value="Other">Other</option>
            </select>
        </div>

        <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Host Name
            </label>
            <input 
                type="text" 
                value={hostName} 
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. Dr. Robert, HR Department, John Smith"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            />
        </div>

        <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Visitor Photo
            </label>
            <input 
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
        </div>

        <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
            {isLoading ? 'Registering...' : 'Register Visitor'}
        </button>

        {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
                {error}
            </div>
        )}
    </form>
  )
}

export default VisitorForm