import { Children, createContext, useEffect, useReducer } from "react";

export const PassContext = createContext()
export const passReducer = (state, action)=>{
    switch(action.type){
        case 'SET_PASSES':
            return {passes: action.payload}
        case 'CREATE_PASS':
            return {passes: [action.payload, ...state.passes]}
        case 'DELETE_PASS':
            return {passes: state.passes.filter((p) => p._id !== action.payload._id)}
        case 'UPDATE_PASS':
            return {
                passes: state.passes.map((p) => 
                    p._id === action.payload._id ? { ...p, status: action.payload.status } : p
                )
            }
        default:
            return state
        
    }
}
export const PassContextProvider = ({children}) =>{
    const [state, dispatch] = useReducer(passReducer, {
        passes: null
    })
    return (
        <PassContext.Provider value={{...state, dispatch}}>
            {children}
        </PassContext.Provider>
    )
}