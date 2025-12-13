import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";

type UploadBody = {
  imageDataUrl?: string;
  walletAddress?: string;
  network?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as UploadBody;

    const rawWallet = (body.walletAddress || "").trim();
    const walletAddress = rawWallet.toLowerCase();
    const network = (body.network || "base").toLowerCase();
    const imageDataUrl = (body.imageDataUrl || "").trim();

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid walletAddress" },
        { status: 400 }
      );
    }

    if (!imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "imageDataUrl (data:image/png;base64,...) is required" },
        { status: 400 }
      );
    }

    const parts = imageDataUrl.split(",");
    if (parts.length !== 2 || !parts[1]) {
      return NextResponse.json(
        { error: "Invalid data URL" },
        { status: 400 }
      );
    }

    const base64 = parts[1];
    const buffer = Buffer.from(base64, "base64");

    const supabase = await createSupabaseClient();

    // 1) Storage upload
    const fileName = `aura-cards/${walletAddress}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("aura-card-images")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("[aura-card-image] upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("aura-card-images").getPublicUrl(fileName);

    // 2) Update latest aura_card row for wallet+network
    const { data: rows, error: selErr } = await supabase
      .from("aura_card")
      .select("id")
      .eq("wallet_address", walletAddress)
      .eq("network", network)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selErr) {
      console.error("[aura-card-image] select error:", selErr);
      return NextResponse.json(
        { imageUrl: publicUrl, warning: selErr.message },
        { status: 200 }
      );
    }

    if (rows && rows.length > 0) {
      const id = rows[0].id as string;
      const { error: updErr } = await supabase
        .from("aura_card")
        .update({ image_url: publicUrl })
        .eq("id", id);

      if (updErr) {
        console.error("[aura-card-image] update error:", updErr);
        return NextResponse.json(
          { imageUrl: publicUrl, warning: updErr.message },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[aura-card-image] fatal error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


