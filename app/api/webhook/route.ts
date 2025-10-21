import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Farcaster JSON Signature verification
interface JFSPayload {
  header: string;
  payload: string;
  signature: string;
}

interface DecodedHeader {
  fid: number;
  type: "custody" | "auth" | "app_key";
  key: string;
}

interface NotificationDetails {
  url: string;
  token: string;
}

interface DecodedPayload {
  event: "frame_added" | "frame_removed" | "notifications_enabled" | "notifications_disabled";
  notificationDetails?: NotificationDetails;
}

function decodeJFS(jfs: JFSPayload): {
  header: DecodedHeader;
  payload: DecodedPayload;
  signature: string;
} {
  const header = JSON.parse(
    Buffer.from(jfs.header, "base64url").toString("utf-8")
  ) as DecodedHeader;

  const payload = JSON.parse(
    Buffer.from(jfs.payload, "base64url").toString("utf-8")
  ) as DecodedPayload;

  const signature = Buffer.from(jfs.signature, "base64url").toString("hex");

  return { header, payload, signature };
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let requestJson: JFSPayload;
  try {
    requestJson = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Log incoming request
  console.log("=== Webhook Received ===");
  console.log("Raw Body:", JSON.stringify(requestJson, null, 2));

  // Decode JFS
  let decoded: ReturnType<typeof decodeJFS>;
  try {
    decoded = decodeJFS(requestJson);
    console.log("Decoded Header:", decoded.header);
    console.log("Decoded Payload:", decoded.payload);
  } catch (error) {
    console.error("JFS Decode Error:", error);
    return Response.json({ error: "Invalid JFS format" }, { status: 400 });
  }

  const { header, payload } = decoded;
  const fid = header.fid;
  const event = payload.event;

  console.log(`FID: ${fid}, Event: ${event}`);

  // Handle different events
  switch (event) {
    case "frame_added":
    case "notifications_enabled":
      if (payload.notificationDetails) {
        const { url, token } = payload.notificationDetails;
        
        // Save notification details to database
        const { error } = await supabase
          .from("farcaster_notifications")
          .upsert({
            fid,
            notification_url: url,
            notification_token: token,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error("Database Error:", error);
          return Response.json(
            { error: "Database error", details: error.message },
            { status: 500 }
          );
        }

        console.log(`✅ Saved notification details for FID ${fid}`);
      }
      break;

    case "frame_removed":
    case "notifications_disabled":
      // Delete notification details
      const { error } = await supabase
        .from("farcaster_notifications")
        .delete()
        .eq("fid", fid);

      if (error) {
        console.error("Database Error:", error);
        return Response.json(
          { error: "Database error", details: error.message },
          { status: 500 }
        );
      }

      console.log(`✅ Deleted notification details for FID ${fid}`);
      break;
  }

  return Response.json({ success: true });
}

