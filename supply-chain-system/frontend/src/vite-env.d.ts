/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_CONTRACT_ADDRESS_SEPOLIA: string
  readonly VITE_CONTRACT_ADDRESS_MAINNET: string
  readonly VITE_SEPOLIA_RPC_URL?: string
  readonly VITE_MAINNET_RPC_URL?: string
  readonly VITE_ENABLE_DEVTOOLS?: string
  readonly VITE_PINATA_API_KEY?: string
  readonly VITE_PINATA_SECRET_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}