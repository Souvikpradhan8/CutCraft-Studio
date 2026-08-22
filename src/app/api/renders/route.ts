import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readRenders } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const renders = await readRenders(user.id);
  return NextResponse.json({ renders });
}
