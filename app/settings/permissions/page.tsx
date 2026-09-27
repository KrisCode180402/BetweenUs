"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SettingsScreen } from "@/components/between-us/settings/SettingsScreen";

export default function PermissionsSettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      initialTab="permissions"
      onClose={() => router.push("/settings")}
    />
  );
}
