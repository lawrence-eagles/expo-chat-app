import { useApi } from "@/lib/axios";
import { ClerkUser } from "@/types";
import { useMutation } from "@tanstack/react-query";

export const useAuthCallback = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiWithAuth<ClerkUser>({
        method: "POST",
        url: "/auth/callback",
      });
      return data;
    },
  });
};
