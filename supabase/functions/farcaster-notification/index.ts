import { createClient } from "npm:@supabase/supabase-js@2";

// Types for incoming webhook payloads
type NotificationEventType =
  | "miniapp_added"
  | "miniapp_removed"
  | "notifications_enabled"
  | "notifications_disabled"
  | string;

interface NotificationDetails {
  notificationId?: string;
}

interface IncomingBody {
  fid?: number | string;
  event?: NotificationEventType;
  notification_id?: string; // snake_case variant
  notificationId?: string; // camelCase variant
  notificationDetails?: NotificationDetails; // nested variant
}

function pickNotificationId(p: IncomingBody): string | undefined {
  return (
    p.notification_id ||
    p.notificationId ||
    p.notificationDetails?.notificationId
  );
}

Deno.serve(async (req: Request) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (req.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });

  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const fid = body.fid != null ? Number(body.fid) : NaN;
  const event: NotificationEventType | undefined = body.event;
  const notificationId = pickNotificationId(body);

  if (!fid)
    return new Response(JSON.stringify({ error: "Missing fid" }), {
      status: 400,
    });

  // Handle disable/remove events by deleting mapping
  if (event === "notifications_disabled" || event === "miniapp_removed") {
    const { error } = await supabaseClient
      .from("farcaster_notifications")
      .delete()
      .eq("fid", fid);
    if (error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (!notificationId)
    return new Response(JSON.stringify({ error: "Missing notificationId" }), {
      status: 400,
    });

  // Single active notification per fid (primary key on fid)
  const { error } = await supabaseClient
    .from("farcaster_notifications")
    .upsert({
      fid,
      notification_id: notificationId,
      updated_at: new Date().toISOString(),
    });

  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

export const config = { runtime: "edge" };
