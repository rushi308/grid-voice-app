import { useEffect, useState } from "react";
import { nextRaceClock } from "../homeState";

export function useRaceClock() {
  const [raceClock, setRaceClock] = useState(0);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setRaceClock((prev) => nextRaceClock(prev));
    }, 1000);

    return () => clearInterval(clockTimer);
  }, []);

  return {
    raceClock,
    resetRaceClock: () => setRaceClock(0),
  };
}
