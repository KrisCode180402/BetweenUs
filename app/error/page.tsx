"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/between-us/ErrorState";

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-[#040814] flex items-center justify-center p-4">
      <ErrorState
        title="SYSTEM RECOVERY"
        message="A connection or runtime error occurred. Please try again or return to Home."
        onRetry={() => router.push("/")}
        onReturnHome={() => router.push("/")}
      />
    </div>
  );
}
