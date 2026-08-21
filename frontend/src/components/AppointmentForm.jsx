import { useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'
import { useCreateAppointment } from '../hooks/useCreateAppointment'

const AppointmentForm = ({ visitorId, onComplete }) => {
    const [dateTime, setDateTime] = useState('')
    const { user } = useAuthContext()
    const { createAppointment, isLoading, error } = useCreateAppointment()

    const handleSubmit = async (e) => {
        e.preventDefault()

        const hostId = user._id

        const selectedDate = new Date(dateTime)
        if (selectedDate.getMinutes() % 15 !== 0) {
            toast.error('Please select a time')
            return 
        }

        const result = await createAppointment(visitorId, hostId, dateTime)

        if (result.success) {
            toast.success('Pass requested! Waiting for Host approval.')
            setDateTime('')
            if (onComplete) 
                onComplete()
        }
    }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="pb-3 border-b border-gray-100">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">Schedule Appointment</h3>
            <p className="text-xs text-gray-500 mt-0.5">Select appointment date & time</p>
        </div>
        
        <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Date & Time (15-min intervals)
            </label>
            <input
                type="datetime-local"
                step="900"
                onChange={(e) => setDateTime(e.target.value)}
                value={dateTime}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
            />
        </div>

        <div className="pt-2 flex flex-col gap-2">
            <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
                {isLoading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>

            {onComplete && (
                <button
                    type="button"
                    onClick={onComplete}
                    className="w-full border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
                >
                    Cancel
                </button>
            )}
        </div>

        {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
                {error}
            </div>
        )}
    </form>
  )
}

export default AppointmentForm