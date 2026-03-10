import { NextResponse } from "next/server";
import { frameReadRequestSchema } from "@/lib/validation/contracts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = frameReadRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const label = parsed.data.frameKey.split("/").at(-1)?.replace(/\.[a-z]+$/i, "") ?? "Frame";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2b2115"/>
          <stop offset="50%" stop-color="#7a5b2f"/>
          <stop offset="100%" stop-color="#0f0c09"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <circle cx="990" cy="120" r="140" fill="rgba(255,224,160,0.08)"/>
      <circle cx="320" cy="520" r="220" fill="rgba(255,224,160,0.05)"/>
      <text x="96" y="610" fill="#f7e8cb" font-size="28" font-family="Inter, Arial, sans-serif" opacity="0.72">${escapeXml(label)}</text>
    </svg>
  `.trim();
  const readUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return NextResponse.json({ readUrl });
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}
