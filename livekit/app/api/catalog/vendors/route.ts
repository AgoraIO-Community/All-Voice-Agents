import { NextRequest, NextResponse } from "next/server";
import { vendorDefinitionSchema } from "@/lib/agent-config";
import { store } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = vendorDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ issues: parsed.error.issues }, { status: 400 });
  }

  const index = store.vendors.findIndex((vendor) => vendor.vendorId === parsed.data.vendorId);
  if (index >= 0) store.vendors[index] = parsed.data;
  else store.vendors.push(parsed.data);

  return NextResponse.json({ vendor: parsed.data, vendors: store.vendors });
}
