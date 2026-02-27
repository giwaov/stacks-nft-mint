# Stacks NFT Mint

NFT minting dApp on **Stacks** (Bitcoin L2) using `@stacks/connect` and `@stacks/transactions`.

## Features

- SIP-009 compliant NFT contract
- Fixed price minting with STX
- Limited supply with progress tracking
- Admin controls for price and minting status

## Tech Stack

- **Smart Contract**: Clarity (SIP-009 NFT)
- **Frontend**: Next.js 14, React 18, TypeScript
- **Wallet**: `@stacks/connect` v7.7.1
- **Transactions**: `@stacks/transactions` v6.13.0
- **Styling**: Tailwind CSS

## Quick Start

```bash
npm install
npm run dev
```

## Contract Functions

- `mint` - Mint a new NFT
- `transfer(id, sender, recipient)` - Transfer NFT
- `get-owner(id)` - Get NFT owner
- `get-token-uri(id)` - Get metadata URI
- `get-total-supply` - Minted count
- `get-mint-price` - Current price

## SIP-009 Compliance

Implements the standard Stacks NFT trait for marketplace compatibility.

## Built For

Stacks Builder Rewards - February 2026
