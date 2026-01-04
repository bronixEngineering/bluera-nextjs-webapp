/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Trophy, Star } from 'lucide-react';
import { base } from 'wagmi/chains';
import {
  useAccount,
  useConnect,
  useChainId,
  useSwitchChain,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import type { Abi } from 'viem';
import { formatUnits } from 'viem';

// Known address (lower/upper case-insensitive lookup on server)
const CLAIM_CONTRACT_ADDRESS = '0x4ee23358C634f80EA26793d605390a9BC4EF997D' as `0x${string}`;
const IS_TEST = false;

// Minimal ERC20 ABI to read decimals/symbol (optional formatting)
const erc20Abi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_rewardToken",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newTotal",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ClaimableUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "Claimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldToken",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newToken",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "RewardTokenChanged",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "claimable",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardToken",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "setClaimable",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "users",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "name": "setClaimableBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newToken",
        "type": "address"
      }
    ],
    "name": "setRewardToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "newAmount",
        "type": "uint256"
      }
    ],
    "name": "updateClaimable",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "withdrawEther",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

export default function RewardsPage() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [contract, setContract] = React.useState<{ address: `0x${string}`; abi: Abi } | null>(null);
  const [isLoadingContract, setIsLoadingContract] = React.useState(true);
  const [isClaiming, setIsClaiming] = React.useState(false);
  const [, setTokenDecimals] = React.useState<number>(18);
  const [tokenSymbol, setTokenSymbol] = React.useState<string>('USDC');


  // Load contract by address from Supabase (via API)
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        setIsLoadingContract(true);
        const addr = CLAIM_CONTRACT_ADDRESS;
        const res = await fetch(`/api/claim-contract?address=${encodeURIComponent(addr)}&is_test=${String(IS_TEST)}`);
        if (!res.ok) {
          const txt = await res.text();
          console.warn('Contracts API error:', res.status, txt);
          throw new Error('Contract not found in Supabase');
        }
        const json = await res.json();
        if (active && json?.address && json?.abi) {
          setContract({ address: json.address as `0x${string}`, abi: json.abi as Abi });
        } else {
          console.warn('Contracts API returned empty data', json);
          setContract(null);
        }
      } catch (e) {
        console.error('Failed to load contract via address:', e);
        setContract(null);
      } finally {
        if (active) setIsLoadingContract(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Optional: read reward token address then decimals/symbol for accurate display
  const { data: rewardTokenAddr } = useReadContract({
    address: contract?.address,
    abi: (contract?.abi || []) as Abi,
    functionName: 'rewardToken',
    args: [],
    chainId: base.id,
    query: { enabled: Boolean(contract?.address) },
  });

  const rewardToken = rewardTokenAddr as `0x${string}` | undefined;

  const { data: decimalsData } = useReadContract({
    address: rewardToken,
    abi: erc20Abi as unknown as Abi,
    functionName: 'decimals',
    args: [],
    chainId: base.id,
    query: { enabled: Boolean(rewardToken) },
  });

  const { data: symbolData } = useReadContract({
    address: rewardToken,
    abi: erc20Abi as unknown as Abi,
    functionName: 'symbol',
    args: [],
    chainId: base.id,
    query: { enabled: Boolean(rewardToken) },
  });

  React.useEffect(() => {
    if (typeof decimalsData === 'number') setTokenDecimals(decimalsData);
    if (typeof symbolData === 'string') setTokenSymbol(symbolData);
  }, [decimalsData, symbolData]);

  // Read claimable(address)
  const { data: claimable, refetch, isLoading: isLoadingClaimable } = useReadContract({
    address: contract?.address,
    abi: (contract?.abi || []) as Abi,
    functionName: 'claimable',
    args: [address as `0x${string}`],
    chainId: base.id,
    query: { enabled: Boolean(address && contract?.address && (contract?.abi as any)?.length) },
  });

  const claimableBigInt = (claimable as bigint) || 0;
  const canClaim = claimableBigInt > 0;

  const handleClaim = async () => {
    try {
      setIsClaiming(true);

      if (!isConnected) {
        await connect({ connector: connectors[0] });
      }
      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }
      if (!contract) throw new Error('Contract not loaded');

      const txHash = await writeContractAsync({
        address: contract.address,
        abi: contract.abi,
        functionName: 'claim',
        args: [],
        chainId: base.id,
      });

      setTimeout(() => refetch(), 2000);
      alert('✅ Claim transaction sent!');
    } catch (e) {
      console.error('Claim failed:', e);
      alert('❌ Failed to claim. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="py-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Rewards</h1>
        <p className="text-sm text-muted-foreground">
          Complete tasks and earn rewards for your trading achievements
        </p>
      </div>

      {isLoadingContract ? (
        <Card>
          <CardContent className="py-12 text-center">Loading rewards…</CardContent>
        </Card>
      ) : !contract ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            Contract not found for address <b>{CLAIM_CONTRACT_ADDRESS}</b>. Add it to Supabase `contracts` with ABI.
          </CardContent>
        </Card>
      ) : !address ? (
        <Card>
          <CardContent className="py-12 text-center">
            Connect your wallet to see if you can claim rewards.
          </CardContent>
        </Card>
      ) : isLoadingClaimable ? (
        <Card>
          <CardContent className="py-12 text-center">Checking rewards…</CardContent>
        </Card>
      ) : canClaim ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              You have claimable rewards
            </CardTitle>
            <CardDescription>
              Amount: {claimableBigInt === 0 ? '0' : formatUnits(claimableBigInt, 6)} {tokenSymbol}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full max-w-xs"
              size="lg"
            >
              {isClaiming ? 'Claiming…' : 'Claim Rewards'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">There is nothing to show here</h3>
              <p className="text-sm text-muted-foreground">
                Rewards system is coming soon. Complete trading tasks to earn points and unlock exclusive rewards.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}