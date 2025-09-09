import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/constants";
export const useUserRole = () => {
  const { user } = useUser();
  const [userData, setUserData] = useState<{ role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) return;

      try {
        const response = await axios.get(`${BASE_URL}/api/users/clerk/${user.id}`);
        console.log("User role fetched:", response.data);
        setUserData(response.data);
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  return {
    isLoading,
    isInterviewer: userData?.role === "interviewer",
    isCandidate: userData?.role === "candidate",
  };
};
