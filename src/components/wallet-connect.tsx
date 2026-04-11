"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Check, AlertCircle, Loader2 } from "lucide-react";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

type WalletConnectProps = {
  onConnect: (address: string) => void;
  currentAddress?: string | null;
};

export function WalletConnect({ onConnect, currentAddress }: WalletConnectProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const hasMetaMask = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;

  async function connectWallet() {
    setError("");

    if (!window.ethereum) {
      setError("No Web3 wallet detected. Please install MetaMask.");
      return;
    }

    setConnecting(true);

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        onConnect(address);
      } else {
        setError("No accounts found. Please unlock your wallet.");
      }
    } catch (err: unknown) {
      const error = err as { code?: number; message?: string };
      if (error.code === 4001) {
        setError("Connection rejected. Please approve the request in your wallet.");
      } else {
        setError(error.message || "Failed to connect wallet.");
      }
    } finally {
      setConnecting(false);
    }
  }

  if (currentAddress) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
        <Check className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">
          Wallet Connected
        </span>
        <span className="font-mono text-xs text-emerald-600">
          {currentAddress.slice(0, 6)}...{currentAddress.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={connectWallet}
        disabled={connecting}
        variant="outline"
        className="gap-2"
      >
        {connecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {connecting
          ? "Connecting..."
          : hasMetaMask
          ? "Connect MetaMask"
          : "Connect Wallet"}
      </Button>
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {!hasMetaMask && !error && (
        <p className="text-xs text-gray-400">
          MetaMask not detected. You can enter your wallet address manually below.
        </p>
      )}
    </div>
  );
}
