import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ vendors: store.vendors, credentialProfiles: store.credentialProfiles });
}
