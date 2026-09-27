"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SettingsScreen } from "@/components/between-us/settings/SettingsScreen";

export default function PrivacySettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      initialTab="privacy"
      onClose={() => router.push("/settings")}
    />
  );
}
