"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SettingsScreen } from "@/components/between-us/settings/SettingsScreen";

export default function SecuritySettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      initialTab="security"
      onClose={() => router.push("/settings")}
    />
  );
}
