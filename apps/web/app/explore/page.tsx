import type { Metadata } from "next";
import { HomePageClient } from "@/components/home/HomePageClient";

export const metadata: Metadata = {
  title: "Explore | Grid Voice",
  description:
    "Season calendar, circuit map, leaderboard, and live session timing. Live race-day AI voice commentary is coming soon; demo round shows the commentary pipeline today.",
};

export default function ExplorePage() {
  return <HomePageClient />;
}
