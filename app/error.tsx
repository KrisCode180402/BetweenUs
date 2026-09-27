"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/between-us/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="w-full min-h-screen bg-[#040814] flex items-center justify-center p-4">
      <ErrorState
        title="UNEXPECTED APPLICATION ERROR"
        message={error.message || "An unexpected error occurred during operation."}
        onRetry={() => reset()}
        onReturnHome={() => (window.location.href = "/")}
      />
    </div>
  );
}
