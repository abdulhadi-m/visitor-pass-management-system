import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useCreateVisitor = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();

  const createVisitor = async (name, email, phone, purpose, photo) => {
    if (!user) {
      setError("You must be loggin in");
      return { success: false };
    }
    setIsLoading(true);
    setError(null);

    const formData = new FormData()
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("purpose", purpose);
    formData.append("photo", photo);

    try {
      const response = await fetch(
        // "https://visitor-pass-management-system-nq1z.onrender.com/api/visitors",
        "http://localhost:5000/api/visitors",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          body: formData, 
        }
      )

      const json = await response.json();
      
      if (!response.ok) {
        setError(json.error)
        setIsLoading(false)
        return { success: false }
      }
      
      if (response.ok) {
        setIsLoading(false)
        return { success: true, data: json }
      }
       
    } catch (err) {
      setError("Failed to connect to the server")
      setIsLoading(false);
      return { success: false };
    } 
  }
  
  return { createVisitor, isLoading, error }
}
