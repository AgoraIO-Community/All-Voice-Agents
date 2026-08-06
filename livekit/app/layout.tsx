import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveKit Voice Agent Console",
  description: "Configure and run LiveKit AI voice agents with swappable ASR, LLM, and TTS vendors.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
