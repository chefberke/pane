"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Canvas from "./features/canvas/Canvas";
import LoadingScreen from "./features/loading/LoadingScreen";
import {
  loadCanvasState,
  saveCanvasState,
} from "./features/canvas/utils/storage";
import { useAuth } from "./features/auth/hooks/useAuth";
import type { CanvasState } from "./features/canvas/types";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Authenticated users belong in /w — redirect them there
  useEffect(() => {
    if (!isLoading && user) router.replace("/w");
  }, [isLoading, user, router]);

  const [initialState] = useState<CanvasState | null>(() =>
    typeof window !== "undefined" ? loadCanvasState() : null,
  );
  const handleSave = useCallback((state: CanvasState) => {
    saveCanvasState(state);
  }, []);

  // Show branded loading while checking auth / redirecting
  if (isLoading || user) {
    return (
      <div className="w-screen h-screen">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <main className="w-screen h-screen overflow-hidden">
      <Canvas initialState={initialState} onSave={handleSave} />
    </main>
  );
}
