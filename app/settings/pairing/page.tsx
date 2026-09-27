"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SettingsScreen } from "@/components/between-us/settings/SettingsScreen";

export default function PairingSettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      initialTab="pairing"
      onClose={() => router.push("/settings")}
    />
  );
}
