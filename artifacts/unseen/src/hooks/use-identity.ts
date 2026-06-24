import { useQuery } from "@tanstack/react-query";

interface Identity {
  anonNumber: number;
  type: "anonymous" | "registered";
}

export function useIdentity() {
  return useQuery<Identity>({
    queryKey: ["/api/identity"],
    queryFn: async () => {
      const res = await fetch("/api/identity", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch identity");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });
}
