import { Address } from 'viem'

// Contract ABI for SupplyChainERC1155 (updated with new functions)
export const SUPPLY_CHAIN_ABI = [
  {"type":"constructor","inputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"CUSTOMS_ROLE","inputs":[],"outputs":[{"name":"","type":"bytes32","internalType":"bytes32"}],"stateMutability":"view"},
  {"type":"function","name":"DEFAULT_ADMIN_ROLE","inputs":[],"outputs":[{"name":"","type":"bytes32","internalType":"bytes32"}],"stateMutability":"view"},
  {"type":"function","name":"DISTRIBUTOR_ROLE","inputs":[],"outputs":[{"name":"","type":"bytes32","internalType":"bytes32"}],"stateMutability":"view"},
  {"type":"function","name":"MANUFACTURER_ROLE","inputs":[],"outputs":[{"name":"","type":"bytes32","internalType":"bytes32"}],"stateMutability":"view"},
  {"type":"function","name":"RETAILER_ROLE","inputs":[],"outputs":[{"name":"","type":"bytes32","internalType":"bytes32"}],"stateMutability":"view"},
  {"type":"function","name":"balanceOf","inputs":[{"name":"account","type":"address","internalType":"address"},{"name":"id","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"balanceOfBatch","inputs":[{"name":"accounts","type":"address[]","internalType":"address[]"},{"name":"ids","type":"uint256[]","internalType":"uint256[]"}],"outputs":[{"name":"","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"},
  {"type":"function","name":"destroyProduct","inputs":[{"name":"tokenId","type":"uint256","internalType":"uint256"},{"name":"reason","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"exists","inputs":[{"name":"id","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},
  {"type":"function","name":"getAllOwnedProducts","inputs":[{"name":"owner","type":"address","internalType":"address"}],"outputs":[{"name":"ownedProductsData","type":"tuple[]","internalType":"struct SupplyChainERC1155.Product[]","components":[{"name":"id","type":"uint256","internalType":"uint256"},{"name":"name","type":"string","internalType":"string"},{"name":"category","type":"string","internalType":"string"},{"name":"serialNumber","type":"string","internalType":"string"},{"name":"productionDate","type":"uint256","internalType":"uint256"},{"name":"geographicalOrigin","type":"string","internalType":"string"},{"name":"metadataHash","type":"bytes32","internalType":"bytes32"},{"name":"metadataUrl","type":"string","internalType":"string"},{"name":"manufacturer","type":"address","internalType":"address"},{"name":"exists","type":"bool","internalType":"bool"}]},{"name":"tokenIds","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"},
  {"type":"function","name":"getOwnedProductsBatch","inputs":[{"name":"owner","type":"address","internalType":"address"},{"name":"startIndex","type":"uint256","internalType":"uint256"},{"name":"count","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"ownedProductsData","type":"tuple[]","internalType":"struct SupplyChainERC1155.Product[]","components":[{"name":"id","type":"uint256","internalType":"uint256"},{"name":"name","type":"string","internalType":"string"},{"name":"category","type":"string","internalType":"string"},{"name":"serialNumber","type":"string","internalType":"string"},{"name":"productionDate","type":"uint256","internalType":"uint256"},{"name":"geographicalOrigin","type":"string","internalType":"string"},{"name":"metadataHash","type":"bytes32","internalType":"bytes32"},{"name":"metadataUrl","type":"string","internalType":"string"},{"name":"manufacturer","type":"address","internalType":"address"},{"name":"exists","type":"bool","internalType":"bool"}]},{"name":"tokenIds","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"},
  {"type":"function","name":"getOwnedProductsCount","inputs":[{"name":"owner","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"getProductsBatch","inputs":[{"name":"startId","type":"uint256","internalType":"uint256"},{"name":"endId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"batchProducts","type":"tuple[]","internalType":"struct SupplyChainERC1155.Product[]","components":[{"name":"id","type":"uint256","internalType":"uint256"},{"name":"name","type":"string","internalType":"string"},{"name":"category","type":"string","internalType":"string"},{"name":"serialNumber","type":"string","internalType":"string"},{"name":"productionDate","type":"uint256","internalType":"uint256"},{"name":"geographicalOrigin","type":"string","internalType":"string"},{"name":"metadataHash","type":"bytes32","internalType":"bytes32"},{"name":"metadataUrl","type":"string","internalType":"string"},{"name":"manufacturer","type":"address","internalType":"address"},{"name":"exists","type":"bool","internalType":"bool"}]},{"name":"validProducts","type":"bool[]","internalType":"bool[]"}],"stateMutability":"view"},
  {"type":"function","name":"grantCustomsRole","inputs":[{"name":"account","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"grantDistributorRole","inputs":[{"name":"account","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"grantManufacturerRole","inputs":[{"name":"account","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"grantRetailerRole","inputs":[{"name":"account","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"grantRole","inputs":[{"name":"role","type":"bytes32","internalType":"bytes32"},{"name":"account","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"hasRole","inputs":[{"name":"role","type":"bytes32","internalType":"bytes32"},{"name":"account","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},
  {"type":"function","name":"isApprovedForAll","inputs":[{"name":"account","type":"address","internalType":"address"},{"name":"operator","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},
  {"type":"function","name":"metadataRegistry","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},
  {"type":"function","name":"nextTokenId","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"ownedProducts","inputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"ownershipHistory","inputs":[{"name":"","type":"uint256","internalType":"uint256"},{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"owner","type":"address","internalType":"address"},{"name":"timestamp","type":"uint256","internalType":"uint256"},{"name":"transferReason","type":"string","internalType":"string"}],"stateMutability":"view"},
  {"type":"function","name":"pause","inputs":[],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"paused","inputs":[],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},
  {"type":"function","name":"products","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"id","type":"uint256","internalType":"uint256"},{"name":"name","type":"string","internalType":"string"},{"name":"category","type":"string","internalType":"string"},{"name":"serialNumber","type":"string","internalType":"string"},{"name":"productionDate","type":"uint256","internalType":"uint256"},{"name":"geographicalOrigin","type":"string","internalType":"string"},{"name":"metadataHash","type":"bytes32","internalType":"bytes32"},{"name":"metadataUrl","type":"string","internalType":"string"},{"name":"manufacturer","type":"address","internalType":"address"},{"name":"exists","type":"bool","internalType":"bool"}],"stateMutability":"view"},
  {"type":"function","name":"registerProduct","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"name","type":"string","internalType":"string"},{"name":"category","type":"string","internalType":"string"},{"name":"serialNumber","type":"string","internalType":"string"},{"name":"geographicalOrigin","type":"string","internalType":"string"},{"name":"metadataUrl","type":"string","internalType":"string"},{"name":"metadataHash","type":"bytes32","internalType":"bytes32"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"safeTransferFrom","inputs":[{"name":"from","type":"address","internalType":"address"},{"name":"to","type":"address","internalType":"address"},{"name":"id","type":"uint256","internalType":"uint256"},{"name":"value","type":"uint256","internalType":"uint256"},{"name":"data","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"setApprovalForAll","inputs":[{"name":"operator","type":"address","internalType":"address"},{"name":"approved","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"supportsInterface","inputs":[{"name":"interfaceId","type":"bytes4","internalType":"bytes4"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},
  {"type":"function","name":"unpause","inputs":[],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"updateMetadataUrl","inputs":[{"name":"tokenId","type":"uint256","internalType":"uint256"},{"name":"newMetadataUrl","type":"string","internalType":"string"},{"name":"newMetadataHash","type":"bytes32","internalType":"bytes32"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"uri","inputs":[{"name":"tokenId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},
  {"type":"event","name":"ApprovalForAll","inputs":[{"name":"account","type":"address","indexed":true,"internalType":"address"},{"name":"operator","type":"address","indexed":true,"internalType":"address"},{"name":"approved","type":"bool","indexed":false,"internalType":"bool"}],"anonymous":false},
  {"type":"event","name":"MetadataUrlUpdated","inputs":[{"name":"tokenId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"oldUrl","type":"string","indexed":false,"internalType":"string"},{"name":"newUrl","type":"string","indexed":false,"internalType":"string"}],"anonymous":false},
  {"type":"event","name":"OwnershipTransferred","inputs":[{"name":"tokenId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"from","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"reason","type":"string","indexed":false,"internalType":"string"}],"anonymous":false},
  {"type":"event","name":"ProductRegistered","inputs":[{"name":"tokenId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"manufacturer","type":"address","indexed":true,"internalType":"address"},{"name":"metadataHash","type":"bytes32","indexed":false,"internalType":"bytes32"},{"name":"metadataUrl","type":"string","indexed":false,"internalType":"string"}],"anonymous":false}
] as const

// Contract addresses for different networks
export const CONTRACT_ADDRESSES: Record<number, Address> = {
  1: (import.meta.env.VITE_CONTRACT_ADDRESS_MAINNET as Address) || '0x0000000000000000000000000000000000000000', // Mainnet
  11155111: (import.meta.env.VITE_CONTRACT_ADDRESS_SEPOLIA as Address) || '0x386D0B0F4eC966117d8c1bb97264f07Fa4b0579b', // Sepolia
  31337: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Hardhat (default)
  1337: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Localhost (default)
}

// Get contract address for current chain
export const getContractAddress = (chainId: number): Address => {
  const address = CONTRACT_ADDRESSES[chainId]
  if (!address) {
    throw new Error(`Contract not deployed on chain ${chainId}`)
  }
  return address
}

// Type definitions
export interface Product {
  id: bigint
  name: string
  category: string
  serialNumber: string
  productionDate: bigint
  geographicalOrigin: string
  metadataHash: string
  metadataUrl: string
  manufacturer: Address
  exists: boolean
}

export interface OwnershipRecord {
  owner: Address
  timestamp: bigint
  transferReason: string
}

export interface ProductFormData {
  name: string
  category: string
  serialNumber: string
  geographicalOrigin: string
  quantity: number
  recipient?: Address
  // IPFS-related fields
  description?: string
  images?: File[]
  additionalData?: Record<string, any>
}

export interface ProductMetadata {
  name: string
  description?: string
  category: string
  serialNumber: string
  geographicalOrigin: string
  productionDate: string
  manufacturer: Address
  images?: string[] // IPFS URLs
  additionalData?: Record<string, any>
}

// Network configuration
export const SUPPORTED_CHAINS = [
  {
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc.sepolia.org'] },
      public: { http: ['https://rpc.sepolia.org'] }
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' }
    },
    testnet: true
  },
  {
    id: 31337,
    name: 'Localhost',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8545'] },
      public: { http: ['http://127.0.0.1:8545'] }
    },
    testnet: true
  }
]