import { PairingMessage } from "./types";
import { AppLogger } from "../privacy/logger";

export interface PairingTransport {
  send(message: PairingMessage): Promise<void>;
  onMessage(handler: (message: PairingMessage) => void): void;
  close(): void;
}

/**
 * Decoupled In-Memory Pairing Transport channel for local test suites and multi-context simulation.
 */
export class LocalInMemoryPairingTransport implements PairingTransport {
  private messageHandlers: Array<(message: PairingMessage) => void> = [];
  private peerTransport: LocalInMemoryPairingTransport | null = null;

  public connectPeer(peer: LocalInMemoryPairingTransport): void {
    this.peerTransport = peer;
    peer.peerTransport = this;
  }

  public async send(message: PairingMessage): Promise<void> {
    if (!this.peerTransport) {
      throw new Error("LocalInMemoryPairingTransport has no connected peer transport.");
    }
    // Asynchronous dispatch to simulate network tick
    const payloadCopy = JSON.parse(JSON.stringify(message)) as PairingMessage;
    setTimeout(() => {
      if (this.peerTransport) {
        this.peerTransport.deliver(payloadCopy);
      }
    }, 1);
  }

  private deliver(message: PairingMessage): void {
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (err) {
        AppLogger.warn("Error in transport message handler", { error: err });
      }
    }
  }

  public onMessage(handler: (message: PairingMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  public close(): void {
    this.messageHandlers = [];
    if (this.peerTransport) {
      this.peerTransport.peerTransport = null;
      this.peerTransport = null;
    }
  }
}
