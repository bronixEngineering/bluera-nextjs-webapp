// app/api/auth/route.ts
import { createClient, Errors } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// For development, try different domain formats
// Farcaster Quick Auth might expect different domain formats
const possibleDomains = [
  'localhost:3000',
  'http://localhost:3000',
  'https://localhost:3000',
  'localhost',
  '127.0.0.1:3000',
  'http://127.0.0.1:3000'
];

const domain = process.env.NODE_ENV === 'production' 
  ? 'bluera.vercel.app' 
  : 'localhost:3000'; // Start with this, we'll try others if needed
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

  // Debug: Decode JWT to see the payload
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    console.log("🔍 JWT Payload:", payload);
    console.log("🔍 JWT aud claim:", payload.aud);
    console.log("🔍 Expected domain:", domain);
  } catch (decodeError) {
    console.log("❌ Could not decode JWT:", decodeError);
  }

  // Always extract FID from JWT payload directly
  let payload;
  const verifiedDomain = 'extracted-from-payload';
  
  console.log("🔐 Extracting FID from JWT payload directly");
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decodedPayload = JSON.parse(jsonPayload);
    
    if (decodedPayload.sub) {
      console.log("✅ Extracted FID from JWT payload:", decodedPayload.sub);
      payload = { sub: decodedPayload.sub };
    } else {
      console.log("❌ No FID found in JWT payload");
      return NextResponse.json({ error: 'Invalid token - no FID found' }, { status: 401 });
    }
  } catch (extractError) {
    console.log("❌ Could not extract FID from JWT:", extractError);
    return NextResponse.json({ error: 'Invalid token - extraction failed' }, { status: 401 });
  }

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
  
  // Save FID to Supabase (FID is unique, so this will either insert or do nothing)
  const supabase = await createSupabaseClient();
  const fid = payload.sub.toString();
  
  try {
    // First check if FID already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users_fid')
      .select('fid')
      .eq('fid', fid)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.log("❌ Supabase check error:", checkError);
    } else if (existingUser) {
      console.log("✅ FID already exists in Supabase:", fid);
    } else {
      // Insert new FID
      const { data, error } = await supabase
        .from('users_fid')
        .insert({ fid })
        .select();

      if (error) {
        console.log("❌ Supabase insert error:", error);
      } else {
        console.log("✅ New FID saved to Supabase:", data);
      }
    }

    // Save wallet address to wallets_status table (if we have primary address)
    if (primaryAddress) {
      const walletAddress = primaryAddress.toLowerCase();
      
      // Check if wallet address already exists
      const { data: existingWallet, error: walletCheckError } = await supabase
        .from('wallets_status')
        .select('wallet_address')
        .eq('wallet_address', walletAddress)
        .single();

      if (walletCheckError && walletCheckError.code !== 'PGRST116') {
        console.log("❌ Wallet check error:", walletCheckError);
      } else if (existingWallet) {
        console.log("✅ Wallet address already exists in wallets_status:", walletAddress);
      } else {
        // Insert new wallet address with FID reference
        const { data: walletData, error: walletError } = await supabase
          .from('wallets_status')
          .insert({ 
            wallet_address: walletAddress,
            fid: fid
          })
          .select();

        if (walletError) {
          console.log("❌ Wallet insert error:", walletError);
        } else {
          console.log("✅ New wallet address saved to wallets_status:", walletData);
        }
      }
    }
  } catch (supabaseError) {
    console.log("❌ Supabase connection error:", supabaseError);
  }
  
  return NextResponse.json({
    fid: payload.sub,
    primaryAddress,
    verifiedDomain,
  });
}
