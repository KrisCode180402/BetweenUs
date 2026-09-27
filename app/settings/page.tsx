"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SettingsModal } from "@/components/between-us/SettingsModal";
import { loadPairedPartner } from "@/lib/pairing/partner-store";

export default function SettingsPage() {
  const router = useRouter();
  const [partnerName, setPartnerName] = useState<string>("Jona");

  useEffect(() => {
    async function fetchPartner() {
      try {
        const partner = await loadPairedPartner();
        if (partner) {
          setPartnerName((partner as any).partnerName || partner.partnerPublicIdentity?.fingerprint?.substring(0, 6) || "Jona");
        }
      } catch {}
    }
    fetchPartner();
  }, []);

  return (
    <SettingsModal
      isOpen={true}
      onClose={() => router.push("/home")}
      partnerName={partnerName}
      onUnpairComplete={() => router.push("/pairing")}
    />
  );
}
