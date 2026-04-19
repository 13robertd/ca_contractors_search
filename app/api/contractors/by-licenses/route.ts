import { NextRequest, NextResponse } from "next/server";
import { getContractorsByLicenses } from "@/lib/queries";

/**
 * POST /api/contractors/by-licenses
 * Body: { licenses: string[] }
 * Returns: Contractor[]
 *
 * Exists so /saved can hydrate from localStorage without shipping the Supabase
 * SDK to the browser. The SDK stays server-side; the client just posts a JSON
 * array of license numbers.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LICENSES = 500;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = (body as { licenses?: unknown })?.licenses;
  if (!Array.isArray(raw)) {
    return NextResponse.json(
      { error: "Body must be { licenses: string[] }" },
      { status: 400 }
    );
  }

  const licenses = raw
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .slice(0, MAX_LICENSES);

  if (licenses.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const data = await getContractorsByLicenses(licenses);
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.error("/api/contractors/by-licenses error:", err);
    return NextResponse.json(
      { error: "Failed to load contractors" },
      { status: 500 }
    );
  }
}
