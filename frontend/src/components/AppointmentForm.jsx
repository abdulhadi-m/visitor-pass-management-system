import { useState, useEffect } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'
import { useCreateAppointment } from '../hooks/useCreateAppointment'
import toast from 'react-hot-toast';

const AppointmentForm = ({ 
    visitorId, 
    onComplete, 
    appointmentDetails = { startTime: '' }, 
    formData = { startTime: '' } 
}) => {

    const [date, setDate] = useState('')
    const [hour, setHour] = useState('09') 
    const [minute, setMinute] = useState('00')
    const [period, setPeriod] = useState('AM')
    const [startTime, setStartTime] = useState(appointmentDetails?.startTime || formData?.startTime || '')

    const { user } = useAuthContext()
    const { createAppointment, isLoading, error } = useCreateAppointment()

    const amHours = ['09', '10', '11']
    const pmHours = ['12', '01', '02', '03', '04', '05']
    const currentHours = period === 'AM' ? amHours : pmHours

    useEffect(() => {
        if (period === 'AM' && !amHours.includes(hour)) setHour('09')
        if (period === 'PM' && !pmHours.includes(hour)) setHour('12')
    }, [period, hour, amHours, pmHours])
    
    const minutesList = ['00', '15', '30', '45']

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!date) {
            toast.error('Please select a date first')
            return
        }
        let militaryHour = parseInt(hour, 10)
        if (period === 'PM' && militaryHour !== 12) {
            militaryHour += 12
        } else if (period === 'AM' && militaryHour === 12) {
            militaryHour = 0 
        }
        
        const formattedHour = militaryHour.toString().padStart(2, '0')
        const combinedDateTime = new Date(`${date}T${formattedHour}:${minute}:00`)
        const hostId = user?._id || null 

        const result = await createAppointment(visitorId, hostId, combinedDateTime.toISOString())

        if (result.success) {
            toast.success('Pass requested! Waiting for Host approval.')
            setDate('')
            setHour('09')
            setMinute('00')
            setPeriod('AM')
            if (onComplete) onComplete(result.data || { dateTime: combinedDateTime.toISOString() })
        }
    }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="pb-3 border-b border-gray-100">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">Schedule Appointment</h3>
            <p className="text-xs text-gray-500 mt-0.5">Select appointment date & time</p>
        </div>
        
        <div className="space-y-4">
            
            <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Date
                </label>
                <input
                    type="date"
                    onChange={(e) => setDate(e.target.value)}
                    value={date}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                />
            </div>

            <div>
                {/* <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    
                </label> */}
                <div className="flex w-full rounded-lg shadow-sm">
                    <button 
                        type="button"
                        onClick={() => setPeriod('AM')}
                        className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-l-lg border border-r-0 transition-colors cursor-pointer ${
                            period === 'AM' 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-slate-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={() => setPeriod('PM')}
                        className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-r-lg border transition-colors cursor-pointer ${
                            period === 'PM' 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-slate-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        PM
                    </button>
                </div>
            </div>

            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Hour
                    </label>
                    <select
                        value={hour}
                        onChange={(e) => setHour(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-center appearance-none"
                    >
                        {currentHours.map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex-none flex items-center justify-center pb-2.5 font-bold text-gray-400">
                    :
                </div>

                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Minute
                    </label>
                    <select
                        value={minute}
                        onChange={(e) => setMinute(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-center appearance-none"
                    >
                        {minutesList.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>

        </div>

        <div className="pt-4 flex flex-col gap-2">
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
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg mt-2">
                {error}
            </div>
        )}
    </form>
  )
}

export default AppointmentForm