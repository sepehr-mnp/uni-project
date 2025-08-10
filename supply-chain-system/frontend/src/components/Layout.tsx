import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { motion } from 'framer-motion'
import { 
  Package, 
  User, 
  ShoppingCart, 
  Plus, 
  LogOut, 
  ChevronDown,
  Network,
  AlertTriangle
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const location = useLocation()

  const navigation = [
    {
      name: 'Client Dashboard',
      href: '/client',
      icon: ShoppingCart,
      current: location.pathname.startsWith('/client')
    },
    {
      name: 'Admin Dashboard',
      href: '/admin',
      icon: Package,
      current: location.pathname.startsWith('/admin')
    }
  ]

  const supportedChains = [
    { id: 1337, name: 'Localhost' },
    { id: 11155111, name: 'Sepolia' },
    { id: 1, name: 'Ethereum' }
  ]

  const currentChain = supportedChains.find(chain => chain.id === chainId)

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Package className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-secondary-900">
                  SupplyChain
                </span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Chain Selector */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 text-sm text-secondary-600 hover:text-secondary-900">
                  <Network className="w-4 h-4" />
                  <span>{currentChain?.name || 'Unknown'}</span>
                  <ChevronDown className="w-3 h-3" />
                </Menu.Button>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-secondary-200 py-1 z-10">
                    {supportedChains.map((chain) => (
                      <Menu.Item key={chain.id}>
                        {({ active }) => (
                          <button
                            onClick={() => switchChain({ chainId: chain.id })}
                            className={`${
                              active ? 'bg-secondary-100' : ''
                            } ${
                              chainId === chain.id ? 'text-primary-600' : 'text-secondary-900'
                            } group flex w-full items-center px-3 py-2 text-sm`}
                          >
                            {chain.name}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Transition>
              </Menu>

              {/* User Menu */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="hidden md:block text-secondary-700 font-medium">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </span>
                  <ChevronDown className="w-3 h-3 text-secondary-400" />
                </Menu.Button>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-secondary-200 py-1 z-10">
                    <div className="px-3 py-2 border-b border-secondary-100">
                      <p className="text-sm font-medium text-secondary-900">Connected</p>
                      <p className="text-xs text-secondary-500 font-mono">
                        {address}
                      </p>
                    </div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => disconnect()}
                          className={`${
                            active ? 'bg-secondary-100' : ''
                          } group flex w-full items-center px-3 py-2 text-sm text-secondary-900`}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Disconnect
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </header>

      {/* Wrong Network Warning */}
      {chainId && !supportedChains.find(chain => chain.id === chainId) && (
        <div className="bg-warning-50 border-b border-warning-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-2 text-warning-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Please switch to a supported network (Localhost, Sepolia, or Ethereum)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
} 