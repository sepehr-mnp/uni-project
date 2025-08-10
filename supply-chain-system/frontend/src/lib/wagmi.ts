import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, hardhat, localhost } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your_project_id'

export const config = createConfig({
  chains: [mainnet, sepolia, hardhat, localhost],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(import.meta.env.VITE_MAINNET_RPC_URL),
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL),
    [hardhat.id]: http(),
    [localhost.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
} 