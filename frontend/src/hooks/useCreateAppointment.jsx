import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useCreateAppointment = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();

  const createAppointment = async (visitorId, hostId, dateTime) => {
    setIsLoading(true);
    setError(null);

    const headers = {
      "Content-Type": "application/json",
    };
    if (user && user.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    try {
      const response = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers,
        body: JSON.stringify({ visitorId, hostId, dateTime }),
      });
      const json = await response.json();
      if (!response.ok) {
        setIsLoading(false);
        setError(json.error);
        return { success: false };
      }
      if (response.ok) {
        setIsLoading(false);
        setError(null);
        return { success: true, data: json };
      }
    } catch (err) {
      setIsLoading(false);
      setError("Failed to connect to the server");
      return { success: false };
    }
  };
  return { createAppointment, isLoading, error };
};
