export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";

type UploadBody = {
  imageDataUrl?: string;
  walletAddress?: string;
  network?: string;
  auraCardId?: string;
};

export async function POST(req: Request) {
  try {
    console.log("[aura-card-image] hit");

    const contentType = req.headers.get("content-type") || "";

    let walletAddress = "";
    let network = "base";
    let auraCardId = "";
    let buffer: Buffer | null = null;
    let uploadContentType = "image/png";
    let ext = "png";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const rawWallet = String(form.get("walletAddress") || "").trim();
      walletAddress = rawWallet.toLowerCase();
      network = String(form.get("network") || "base").trim().toLowerCase();
      auraCardId = String(form.get("auraCardId") || "").trim();

      const file = form.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "file is required" }, { status: 400 });
      }

      uploadContentType = file.type || "image/png";
      ext = uploadContentType === "image/jpeg" ? "jpg" : "png";
      const ab = await file.arrayBuffer();
      buffer = Buffer.from(ab);
    } else {
      // Backward compatible JSON data URL
      const body = (await req.json().catch(() => ({}))) as UploadBody;
      const rawWallet = (body.walletAddress || "").trim();
      walletAddress = rawWallet.toLowerCase();
      network = (body.network || "base").toLowerCase();
      const imageDataUrl = (body.imageDataUrl || "").trim();
      auraCardId = (body.auraCardId || "").trim();

      if (!imageDataUrl.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "imageDataUrl (data:image/png;base64,...) is required" },
          { status: 400 }
        );
      }

      const parts = imageDataUrl.split(",");
      if (parts.length !== 2 || !parts[1]) {
        return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
      }

      const meta = parts[0];
      const base64 = parts[1];
      const m = meta.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64$/);
      uploadContentType = m?.[1] || "image/png";
      ext = uploadContentType === "image/jpeg" ? "jpg" : "png";
      buffer = Buffer.from(base64, "base64");
    }

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid walletAddress" },
        { status: 400 }
      );
    }
    if (!buffer) {
      return NextResponse.json({ error: "Missing image buffer" }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    // 1) Storage upload
    const fileName = `aura-cards/${walletAddress}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("aura-card-images")
      .upload(fileName, buffer, {
        contentType: uploadContentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[aura-card-image] upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("aura-card-images").getPublicUrl(fileName);

    // 2) Update aura_card row
    // Prefer updating by explicit id to avoid mismatches.
    const updateTargetId = auraCardId || null;

    if (updateTargetId) {
      const { error: updErr } = await supabase
        .from("aura_card")
        .update({ image_url: publicUrl })
        .eq("id", updateTargetId);

      if (updErr) {
        console.error("[aura-card-image] update-by-id error:", updErr);
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }

      return NextResponse.json({ imageUrl: publicUrl, id: updateTargetId });
    }

    // Fallback: update latest aura_card row for wallet+network
    const { data: rows, error: selErr } = await supabase
      .from("aura_card")
      .select("id")
      .eq("wallet_address", walletAddress)
      .eq("network", network)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selErr) {
      console.error("[aura-card-image] select error:", selErr);
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "No aura_card row found for wallet/network" },
        { status: 404 }
      );
    }

    const id = rows[0].id as string;
    const { error: updErr } = await supabase
      .from("aura_card")
      .update({ image_url: publicUrl })
      .eq("id", id);

    if (updErr) {
      console.error("[aura-card-image] update error:", updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: publicUrl, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[aura-card-image] fatal error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


