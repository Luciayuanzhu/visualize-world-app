import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Visualize Writing MVP",
  description: "Writing-only MVP for Visualize",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
