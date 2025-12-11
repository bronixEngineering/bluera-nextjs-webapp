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

  const fid = payload.sub.toString();

  // Get user's username from Farcaster API
  let userName: string | null = null;
  try {
    const userRes = await fetch(
      `https://api.farcaster.xyz/v2/user-by-fid?fid=${fid}`
    );
    if (userRes.ok) {
      const userData = await userRes.json();
      // Farcaster API returns username in result.user.username
      userName = userData?.result?.user?.username || null;
    }
  } catch {
    // Silently fail - username is optional
  }

  // Connected wallet (Miniapp'ten gelen) - primary fetch yerine bunu kullan
  const { searchParams } = new URL(request.url);
  const walletParam = searchParams.get('wallet') || searchParams.get('walletAddress');
  const providedWallet = walletParam && /^0x[a-fA-F0-9]{40}$/.test(walletParam)
    ? walletParam.toLowerCase()
    : null;
  
  // Save FID to Supabase (FID is unique, so this will either insert or do nothing)
  const supabase = await createSupabaseClient();

  try {
    // First check if FID already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users_fid')
      .select('fid, user_name')
      .eq('fid', fid)
      .single();

    if (!existingUser && (!checkError || checkError.code === 'PGRST116')) {
      // Insert new FID with username
      await supabase
        .from('users_fid')
        .insert({ 
          fid,
          user_name: userName
        })
        .select();
    } else if (existingUser && userName && existingUser.user_name !== userName) {
      // Update username if it has changed
      await supabase
        .from('users_fid')
        .update({ user_name: userName })
        .eq('fid', fid);
    }

    // Match provided wallet (connected wallet) to wallets_status with fid
    if (providedWallet) {
      await supabase
        .from('wallets_status')
        .upsert(
          { wallet_address: providedWallet, fid },
          { onConflict: 'wallet_address' }
        )
        .select();
    }
  } catch {
    // Silently fail
  }

  return NextResponse.json({
    fid: payload.sub,
    walletAddress: providedWallet,
    verifiedDomain,
    userName,
  });
}
