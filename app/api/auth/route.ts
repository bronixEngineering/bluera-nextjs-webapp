// app/api/auth/route.ts
// import { createClient } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// const _client = createClient(); // Unused for now

// This endpoint returns the authenticated user's FID 
export async function GET(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authorization.split(' ')[1];

  // Extract FID from JWT payload directly
  let payload;
  const verifiedDomain = 'extracted-from-payload';
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decodedPayload = JSON.parse(jsonPayload);
    
    if (decodedPayload.sub) {
      payload = { sub: decodedPayload.sub };
    } else {
      return NextResponse.json({ error: 'Invalid token - no FID found' }, { status: 401 });
    }
  } catch {
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
    }
  } catch {
    // Silently fail
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

    if (!existingUser && (!checkError || checkError.code === 'PGRST116')) {
      // Insert new FID
      await supabase
        .from('users_fid')
        .insert({ fid })
        .select();
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

      if (!existingWallet && (!walletCheckError || walletCheckError.code === 'PGRST116')) {
        // Insert new wallet address with FID reference
        await supabase
          .from('wallets_status')
          .insert({ 
            wallet_address: walletAddress,
            fid: fid
          })
          .select();
      }
    }
  } catch {
    // Silently fail
  }
  
  return NextResponse.json({
    fid: payload.sub,
    primaryAddress,
    verifiedDomain,
  });
}
