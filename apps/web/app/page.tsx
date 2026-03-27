import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Grid Voice | AI voice commentary",
  description:
    "Grid Voice pairs OpenAI-generated commentary text with synthesized speech (TTS), on AWS Serverless—explore live transcript, audio, and timing.",
};

export default function Home() {
  return <LandingPage />;
}
