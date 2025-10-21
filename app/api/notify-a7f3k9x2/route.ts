import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface SendNotificationBody {
  title: string;
  body: string;
  targetUrl?: string;
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let requestBody: SendNotificationBody;
  try {
    requestBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, body, targetUrl } = requestBody;

  if (!title || !body) {
    return Response.json(
      { error: "Missing title or body" },
      { status: 400 }
    );
  }

  // Get all notification tokens from database
  const { data: notifications, error: fetchError } = await supabase
    .from("farcaster_notifications")
    .select("fid, notification_url, notification_token");

  if (fetchError) {
    console.error("Database Error:", fetchError);
    return Response.json(
      { error: "Failed to fetch notification tokens" },
      { status: 500 }
    );
  }

  if (!notifications || notifications.length === 0) {
    return Response.json(
      { message: "No users to notify", sent: 0 },
      { status: 200 }
    );
  }

  console.log(`Found ${notifications.length} users to notify`);

  // Group notifications by URL (different Farcaster clients might have different URLs)
  const notificationsByUrl = notifications.reduce((acc, notif) => {
    const url = notif.notification_url;
    if (!acc[url]) {
      acc[url] = [];
    }
    acc[url].push(notif.notification_token);
    return acc;
  }, {} as Record<string, string[]>);

  const results = {
    total: notifications.length,
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Send notifications in batches of 100 per URL
  for (const [url, tokens] of Object.entries(notificationsByUrl)) {
    // Split into batches of 100
    for (let i = 0; i < tokens.length; i += 100) {
      const batch = tokens.slice(i, i + 100);
      
      const notificationPayload = {
        notificationId: `notif-${Date.now()}-${i}`,
        title: title,
        body: body,
        targetUrl: targetUrl || "https://bluera.vercel.app",
        tokens: batch,
      };

      try {
        console.log(`Sending to ${batch.length} users via ${url}`);
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notificationPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to send notification: ${errorText}`);
          results.failed += batch.length;
          results.errors.push(`Batch ${i}: ${errorText}`);
          continue;
        }

        const result = await response.json();
        console.log("Notification result:", result);

        results.successful += result.successfulTokens?.length || 0;
        results.failed += result.invalidTokens?.length || 0;
        results.failed += result.rateLimitedTokens?.length || 0;

        // Remove invalid tokens from database
        if (result.invalidTokens && result.invalidTokens.length > 0) {
          await supabase
            .from("farcaster_notifications")
            .delete()
            .in("notification_token", result.invalidTokens);
          
          console.log(`Removed ${result.invalidTokens.length} invalid tokens`);
        }
      } catch (error) {
        console.error("Error sending notification:", error);
        results.failed += batch.length;
        results.errors.push(`Batch ${i}: ${error}`);
      }
    }
  }

  return Response.json({
    message: "Notifications sent",
    ...results,
  });
}

