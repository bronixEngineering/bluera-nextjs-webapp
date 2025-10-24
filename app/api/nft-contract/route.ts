import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(req.url);

    const addressParam = searchParams.get("address");
    const name = searchParams.get("name");
    const isTestParam = searchParams.get("is_test");
    const isTest =
      isTestParam === "true" ? true : isTestParam === "false" ? false : undefined;

      let query = supabase
      .from("contracts")
      .select("id,name,address,abi,is_test,created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (addressParam) {
      const normalized = addressParam.toLowerCase();
      query = query.eq("address", normalized);
    } else {
      if (name) query = query.eq("name", name);
      if (typeof isTest === "boolean") query = query.eq("is_test", isTest);
    }
    
    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0)
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    return NextResponse.json(data[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}