import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthContextProvider } from './context/AuthContext.jsx'
import { PassContextProvider} from './context/PassContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthContextProvider>
      <PassContextProvider>
        <App />
      </PassContextProvider>
    </AuthContextProvider>
  </StrictMode>,
)
