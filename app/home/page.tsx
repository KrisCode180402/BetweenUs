"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HomeScreen } from "@/components/between-us/HomeScreen";

export default function HomePage() {
  const router = useRouter();

  const handleInitiateAudioCall = () => {
    router.push("/call/audio");
  };

  const handleInitiateVideoCall = () => {
    router.push("/call/video");
  };

  return (
    <HomeScreen
      onInitiateAudioCall={handleInitiateAudioCall}
      onInitiateVideoCall={handleInitiateVideoCall}
    />
  );
}
