import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useCreateVisitor = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();

  const createVisitor = async (name, email, phone, purpose) => {
    if (!user) {
      setError("You must be loggin in");
      return { success: false };
    }
    setIsLoading(true);
    setError(null);

    const response = await fetch(
      "https://visitor-pass-management-system-nq1z.onrender.com/api/visitors",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          purpose,
          photo_url: "https://dummyimage.com/150x150",
        }),
      },
    );

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
  };
  return { createVisitor, isLoading, error };
};
