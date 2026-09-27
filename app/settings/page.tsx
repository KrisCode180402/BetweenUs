"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SettingsScreen } from "@/components/between-us/settings/SettingsScreen";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <SettingsScreen
      onClose={() => router.push("/home")}
    />
  );
}
