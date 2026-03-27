import type { Metadata } from "next";
import { Space_Grotesk, Titillium_Web } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const titilliumWeb = Titillium_Web({
  variable: "--font-titillium-web",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grid Voice | Live F1 AI voice commentary platform",
  description:
    "Live Formula 1 AI voice commentary platform. Language models draft lines from laps, gaps, and timing; text-to-speech turns them into audio when enabled—streamed from an AWS Serverless pipeline the explore view consumes end to end.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${titilliumWeb.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
