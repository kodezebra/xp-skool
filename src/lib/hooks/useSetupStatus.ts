import { useState, useEffect } from "react";
import { queries } from "@/lib/db";

export function useSetupStatus() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSetup() {
      try {
        const setting = await queries.settings.findByKey("setup_completed");
        setIsSetupComplete(setting?.value === "true");
      } catch (error) {
        console.error("Failed to check setup status:", error);
        setIsSetupComplete(false);
      }
    }
    checkSetup();
  }, []);

  return isSetupComplete;
}
