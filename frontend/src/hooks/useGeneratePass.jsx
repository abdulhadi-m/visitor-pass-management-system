import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import { usePassContext } from "./usePassContext";

export const useGeneratePass = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();
  const { dispatch } = usePassContext();

  const generatePass = async (appointmentId) => {
    if (!user) {
      setError("You must be logged in");
      return { success: false };
    }
    setIsLoading(true);
    setError(null);

    const response = await fetch(
      "https://visitor-pass-management-system-nq1z.onrender.com/api/passes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ appointmentId }),
      },
    );
    const json = await response.json();
    if (!response.ok) {
      setIsLoading(false);
      setError(json.error);
      return { success: false };
    }
    if (response.ok) {
      dispatch({ type: "CREATE_PASS", payload: json });
      setIsLoading(false);
      setError(null);
      return { success: true, data: json };
    }
  };
  return { generatePass, isLoading, error };
};
