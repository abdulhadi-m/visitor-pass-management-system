import { useState } from "react"
import { useAuthContext } from "./useAuthContext"

export const useCreateAppointment = () =>{
    const[error, setError]= useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const { user } = useAuthContext()

    const createAppointment = async (visitorId, hostId, dateTime) => {
        if (!user) {
            setError('You must be logged in')
            return { success: false }
        }
        setIsLoading(true)
        setError(null)

        const response = await fetch('http://localhost:5000/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({visitorId, hostId, dateTime})
        })
        const json = await response.json()
        if(!response.ok){
            setIsLoading(false)
            setError(json.error)
            return{success: false}
        }
        if(response.ok){
            setIsLoading(false)
            setError(null)
            return{success: true, data: json}
        }

    }
    return {createAppointment, isLoading, error}
}