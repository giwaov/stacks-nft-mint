export interface NFT {
  tokenId: number;
  owner: string;
  uri: string;
  mintedAt: number;
}

export interface Collection {
  name: string;
  symbol: string;
  baseUri: string;
  totalSupply: number;
  maxSupply: number;
  mintPrice: number;
}

export interface NFTStats {
  totalMinted: number;
  uniqueOwners: number;
  totalVolume: number;
}

export interface WalletState {
  address: string | null;
  connected: boolean;
  balance: number;
}

export interface TransactionResult {
  txId: string;
  success: boolean;
  error?: string;
}
