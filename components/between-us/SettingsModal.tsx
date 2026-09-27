"use client";

import React from "react";
import { SettingsScreen } from "./settings/SettingsScreen";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName?: string | undefined;
  myDeviceName?: string | undefined;
  onUnpairComplete?: (() => void) | undefined;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onUnpairComplete: _onUnpairComplete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#040814] flex items-center justify-center select-none animate-fade-in">
      <SettingsScreen onClose={onClose} />
    </div>
  );
};
