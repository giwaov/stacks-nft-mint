"use client";

import { useState, useEffect, useCallback } from "react";
import { AppConfig, UserSession, showConnect, openContractCall } from "@stacks/connect";
import { StacksMainnet } from "@stacks/network";
import {
  callReadOnlyFunction,
  cvToJSON,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
} from "@stacks/transactions";

const CONTRACT_ADDRESS = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
const CONTRACT_NAME = "nft-mint";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });
const network = new StacksMainnet();

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState(0);
  const [maxSupply, setMaxSupply] = useState(1000);
  const [mintPrice, setMintPrice] = useState(1);
  const [mintActive, setMintActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      setIsConnected(true);
      setAddress(data.profile.stxAddress.testnet);
    }
  }, []);

  const connect = () => {
    showConnect({
      appDetails: { name: "Stacks NFT Mint", icon: "/logo.png" },
      onFinish: () => {
        const data = userSession.loadUserData();
        setIsConnected(true);
        setAddress(data.profile.stxAddress.testnet);
      },
      userSession,
    });
  };

  const disconnect = () => {
    userSession.signUserOut();
    setIsConnected(false);
    setAddress(null);
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [supplyResult, maxResult, priceResult, activeResult] = await Promise.all([
        callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: "get-total-supply",
          functionArgs: [],
          senderAddress: CONTRACT_ADDRESS,
        }),
        callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: "get-max-supply",
          functionArgs: [],
          senderAddress: CONTRACT_ADDRESS,
        }),
        callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: "get-mint-price",
          functionArgs: [],
          senderAddress: CONTRACT_ADDRESS,
        }),
        callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: "is-mint-active",
          functionArgs: [],
          senderAddress: CONTRACT_ADDRESS,
        }),
      ]);

      setTotalSupply(parseInt(cvToJSON(supplyResult).value));
      setMaxSupply(parseInt(cvToJSON(maxResult).value));
      setMintPrice(parseInt(cvToJSON(priceResult).value) / 1000000);
      setMintActive(cvToJSON(activeResult).value);
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const mint = async () => {
    if (!isConnected || !address) return;
    setMinting(true);

    const price = mintPrice * 1000000;

    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "mint",
        functionArgs: [],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [
          makeStandardSTXPostCondition(
            address,
            FungibleConditionCode.Equal,
            price
          ),
        ],
        onFinish: () => {
          setTimeout(fetchStats, 3000);
        },
      });
    } catch (e) {
      console.error("Error minting:", e);
    }
    setMinting(false);
  };

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const progress = (totalSupply / maxSupply) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-900 to-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-8">
        <h1 className="text-2xl font-bold">🎨 Stacks NFT</h1>
        {isConnected ? (
          <div className="text-right">
            <p className="text-sm text-pink-300">{truncate(address!)}</p>
            <button onClick={disconnect} className="text-sm underline">Disconnect</button>
          </div>
        ) : (
          <button
            onClick={connect}
            className="bg-pink-500 hover:bg-pink-600 px-6 py-2 rounded-lg font-semibold"
          >
            Connect Wallet
          </button>
        )}
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-8 py-16 text-center">
        <div className="mb-8">
          <div className="w-64 h-64 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-8xl shadow-2xl">
            🖼️
          </div>
        </div>

        <h2 className="text-5xl font-bold mb-4">Stacks Genesis NFT</h2>
        <p className="text-xl text-pink-300 mb-8">
          Limited edition NFTs on Bitcoin L2
        </p>

        {/* Progress */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>{totalSupply} minted</span>
            <span>{maxSupply} total</span>
          </div>
          <div className="h-4 bg-pink-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-pink-400 text-sm mt-2">
            {maxSupply - totalSupply} remaining
          </p>
        </div>

        {/* Price */}
        <div className="bg-pink-900/30 rounded-xl p-6 max-w-md mx-auto mb-8">
          <div className="flex justify-between items-center">
            <span className="text-pink-300">Mint Price</span>
            <span className="text-3xl font-bold">{mintPrice} STX</span>
          </div>
        </div>

        {/* Mint Button */}
        {!mintActive ? (
          <div className="bg-gray-800 px-8 py-4 rounded-xl inline-block">
            <p className="text-gray-400">Minting Paused</p>
          </div>
        ) : totalSupply >= maxSupply ? (
          <div className="bg-gray-800 px-8 py-4 rounded-xl inline-block">
            <p className="text-gray-400">Sold Out!</p>
          </div>
        ) : (
          <button
            onClick={mint}
            disabled={!isConnected || minting}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 px-12 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105"
          >
            {minting ? "Minting..." : `Mint for ${mintPrice} STX`}
          </button>
        )}

        {!isConnected && (
          <p className="text-pink-400 mt-4">Connect wallet to mint</p>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-pink-900/20 rounded-xl p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-semibold mb-2">Bitcoin Secured</h3>
            <p className="text-pink-300 text-sm">
              Built on Stacks, secured by Bitcoin
            </p>
          </div>
          <div className="bg-pink-900/20 rounded-xl p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-semibold mb-2">Limited Supply</h3>
            <p className="text-pink-300 text-sm">
              Only {maxSupply} will ever exist
            </p>
          </div>
          <div className="bg-pink-900/20 rounded-xl p-6">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="font-semibold mb-2">Fully On-chain</h3>
            <p className="text-pink-300 text-sm">
              SIP-009 compliant NFT standard
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center py-8 text-pink-400 text-sm">
        <p>Built with @stacks/connect & @stacks/transactions</p>
        <p>Stacks Builder Rewards February 2026</p>
      </footer>
    </main>
  );
}
