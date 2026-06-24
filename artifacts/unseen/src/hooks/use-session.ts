import { useEffect, useState } from "react";

export function useSession() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem("unseen_session_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("unseen_session_id", id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
