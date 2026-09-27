"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SettingsScreen } from "@/components/between-us/settings/SettingsScreen";

export default function DeviceSettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      initialTab="device"
      onClose={() => router.push("/settings")}
    />
  );
}
