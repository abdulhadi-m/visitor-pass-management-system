import { useContext } from "react"
import {PassContext} from '../context/PassContext'

export const usePassContext = ()=>{
    const context = useContext(PassContext)

    if(!context){
        throw Error('usePassContext must be used inside a PassContextProvider')
    }
    return context
}