"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SettingsScreen } from "@/components/between-us/settings/SettingsScreen";

export default function ResetSettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      initialTab="reset"
      onClose={() => router.push("/settings")}
    />
  );
}
