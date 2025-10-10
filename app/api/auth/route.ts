// app/api/auth/route.ts
import { createClient, Errors } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';

const domain = process.env.NODE_ENV === 'production' 
  ? 'bluera.vercel.app' 
  : 'localhost:3000'; // Must match your mini app's deployment domain
const client = createClient();

// This endpoint returns the authenticated user's FID 
export async function GET(request: NextRequest) {
  console.log("🔍 Auth API called!");
  console.log("Request URL:", request.url);
  console.log("Request headers:", Object.fromEntries(request.headers.entries()));
  
  const authorization = request.headers.get('Authorization');
  console.log("Authorization header:", authorization);
  
  if (!authorization?.startsWith('Bearer ')) {
    console.log("❌ No Bearer token found");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authorization.split(' ')[1];
  console.log("Token:", token?.substring(0, 20) + "...");

  try {
    console.log("🔐 Verifying JWT with domain:", domain);
    const payload = await client.verifyJwt({ token, domain });
    console.log("✅ JWT verified successfully:", payload);
    
    // Optional: Get user's primary Ethereum address
    let primaryAddress;
    try {
      const res = await fetch(
        `https://api.farcaster.xyz/fc/primary-address?fid=${payload.sub}&protocol=ethereum`
      );
      if (res.ok) {
        const { result } = await res.json();
        primaryAddress = result.address.address;
        console.log("📍 Primary address:", primaryAddress);
      }
    } catch (addrError) {
      console.log("⚠️ Could not fetch primary address:", addrError);
    }
    
    return NextResponse.json({
      fid: payload.sub,
      primaryAddress,
    });
  } catch (e) {
    console.log("❌ JWT verification failed:", e);
    if (e instanceof Errors.InvalidTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    throw e;
  }
}
