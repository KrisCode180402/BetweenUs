"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HomeScreen } from "@/components/between-us/HomeScreen";

export default function HomePage() {
  const router = useRouter();

  const handleInitiateAudioCall = () => {
    router.push("/audio");
  };

  const handleInitiateVideoCall = () => {
    router.push("/video");
  };

  return (
    <HomeScreen
      onInitiateAudioCall={handleInitiateAudioCall}
      onInitiateVideoCall={handleInitiateVideoCall}
    />
  );
}
