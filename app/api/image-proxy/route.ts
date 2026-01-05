import { NextRequest, NextResponse } from "next/server";

function isSafeHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = (searchParams.get("url") || "").trim();

  if (!url || !isSafeHttpUrl(url)) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      // Avoid sending cookies/credentials
      credentials: "omit",
      redirect: "follow",
      // Some CDNs require a UA; setting a generic one helps in certain webviews
      headers: {
        "user-agent": "Mozilla/5.0",
        accept: "image/*,*/*;q=0.8",
      },
      // Allow caching on the edge/runtime
      next: { revalidate: 60 * 60 }, // 1 hour
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "not an image" }, { status: 415 });
    }

    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


