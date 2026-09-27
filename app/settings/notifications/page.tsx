"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SettingsScreen } from "@/components/between-us/settings/SettingsScreen";

export default function NotificationsSettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      initialTab="notifications"
      onClose={() => router.push("/settings")}
    />
  );
}
