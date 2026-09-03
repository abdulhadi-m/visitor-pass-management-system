import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useCreateVisitor = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();

  const createVisitor = async (name, email, phone, purpose, photo, hostName) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("purpose", purpose);
    if (hostName) {
      formData.append("hostName", hostName);
    }
    if (photo) {
      formData.append("photo", photo);
    }

    try {
      const headers = {};
      if (user && user.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const response = await fetch("http://localhost:5000/api/visitors", {
        method: "POST",
        headers,
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error);
        setIsLoading(false);
        return { success: false };
      }

      if (response.ok) {
        setIsLoading(false);
        return { success: true, data: json };
      }
    } catch (err) {
      setError("Failed to connect to the server");
      setIsLoading(false);
      return { success: false };
    }
  };

  return { createVisitor, isLoading, error };
};
