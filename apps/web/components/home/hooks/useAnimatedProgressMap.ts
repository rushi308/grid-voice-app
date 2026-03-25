import { useEffect, useState } from "react";
import { initialPointers } from "@/lib/season2026";
import { buildInitialProgress } from "../homeState";

export function useAnimatedProgressMap() {
  const [progressMap, setProgressMap] = useState<Record<string, number>>(() =>
    buildInitialProgress(),
  );

  useEffect(() => {
    let frameId = 0;
    let prevTime = performance.now();

    const animate = (now: number) => {
      const delta = (now - prevTime) / 1000;
      prevTime = now;

      setProgressMap((prev) => {
        const updated: Record<string, number> = { ...prev };
        initialPointers.forEach((driver) => {
          const current = updated[driver.code] ?? driver.progress;
          const drift = (Math.sin(now / 1800 + driver.pace * 10) + 1) * 0.00003;
          updated[driver.code] =
            (current + (driver.pace / 60) * delta + drift) % 1;
        });
        return updated;
      });

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return {
    progressMap,
    resetProgressMap: () => setProgressMap(buildInitialProgress()),
  };
}
