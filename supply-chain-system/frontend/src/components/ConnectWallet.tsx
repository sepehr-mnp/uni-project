import React from 'react'
import { useConnect, useAccount } from 'wagmi'
import { Wallet, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function ConnectWallet() {
  const { connectors, connect, isPending } = useConnect()
  const { isConnecting } = useAccount()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card glass-card"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-secondary-600">
          Choose your preferred wallet to get started
        </p>
      </div>

      <div className="space-y-3">
        {connectors.map((connector) => (
          <motion.button
            key={connector.uid}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => connect({ connector })}
            disabled={isPending || isConnecting}
            className="w-full btn-primary py-3 text-left flex items-center justify-between disabled:opacity-50"
          >
            <span className="font-medium">
              {connector.name === 'Injected' ? 'Browser Wallet' : connector.name}
            </span>
            {(isPending || isConnecting) && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </motion.button>
        ))}
      </div>

      <div className="mt-6 text-xs text-secondary-500 text-center">
        By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
      </div>
    </motion.div>
  )
} 