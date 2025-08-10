import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { config } from '../lib/wagmi'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Package, 
  TrendingUp, 
  AlertCircle,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { SUPPLY_CHAIN_ABI, getContractAddress, Product } from '../lib/contract'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'

export function AdminDashboard() {
  const { address, chainId } = useAccount()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [products, setProducts] = useState<(Product & { status: 'active' | 'transferred' | 'destroyed' })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadedCount, setLoadedCount] = useState(0)
  const [totalSupply, setTotalSupply] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const PRODUCTS_PER_LOAD = 10

  // Read next token ID from contract (total products = nextTokenId - 1)
  const { data: contractNextTokenId, refetch: refetchTotalSupply } = useReadContract({
    address: chainId ? getContractAddress(chainId) : undefined,
    abi: SUPPLY_CHAIN_ABI,
    functionName: 'nextTokenId',
    query: {
      enabled: !!chainId
    }
  })

  // Function to load products from blockchain using the new approach
  const loadProducts = async (reset: boolean = false) => {
    if (!chainId || !address) return

    if (reset) {
      setIsLoading(true)
      setLoadedCount(0)
      setProducts([])
    } else {
      setIsLoadingMore(true)
    }

    const contractAddress = getContractAddress(chainId)

    try {
      const total = totalSupply
      if (total === 0) {
        setProducts([])
        return
      }

      const startIndex = reset ? 0 : loadedCount
      const loadCount = Math.min(PRODUCTS_PER_LOAD, total - startIndex)
      console.log("tst01")
      if (loadCount <= 0) {
        return // No more products to load
      }
      console.log("tst02")
      
      // Use getProductsBatch with nextTokenId approach for admin (newest first)
      // Calculate range to get newest products first
      const startId = Math.max(1, total - loadedCount - loadCount + 1)
      const endId = total - loadedCount
      console.log("tst03")
      
      if (startId > endId) {
        return // No more products to load
      }
      console.log("tst04", startId, endId)
      
      const batchResult = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: SUPPLY_CHAIN_ABI,
        functionName: 'getProductsBatch',
        args: [BigInt(startId), BigInt(endId)]
      })
      
      const [batchProducts, validProducts] = batchResult as [any[], any[]]

      const loadedProducts: (Product & { status: 'active' | 'transferred' | 'destroyed' })[] = []

      for (let i = 0; i < batchProducts.length; i++) {
        // Check validity for getProductsBatch
        if (validProducts && !validProducts[i]) continue

        const productData = batchProducts[i]

        try {
          const product: Product & { status: 'active' | 'transferred' | 'destroyed' } = {
            id: BigInt(productData.id),
            name: productData.name,
            category: productData.category,
            serialNumber: productData.serialNumber,
            productionDate: BigInt(productData.productionDate),
            geographicalOrigin: productData.geographicalOrigin,
            metadataHash: productData.metadataHash,
            metadataUrl: productData.metadataUrl,
            manufacturer: productData.manufacturer,
            exists: productData.exists,
            status: productData.exists ? 'active' : 'destroyed'
          }

          loadedProducts.push(product)
        } catch (error) {
          console.warn('Error processing product:', error)
        }
      }

      // Reverse the order to maintain newest first (since we get them in reverse chronological order)
      loadedProducts.reverse()

      if (reset) {
        setProducts(loadedProducts)
        setLoadedCount(loadedProducts.length)
      } else {
        setProducts(prev => [...prev, ...loadedProducts])
        setLoadedCount(prev => prev + loadedProducts.length)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products from blockchain')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      if (!contractNextTokenId) return

      setTotalSupply(Number(contractNextTokenId) - 1) // Total products = nextTokenId - 1
      await loadProducts(true) // Reset and load first batch
    }

    initialLoad()
  }, [contractNextTokenId, chainId, address])

  // Load more products
  const loadMoreProducts = async () => {
    if (isLoadingMore || loadedCount >= totalSupply) return
    await loadProducts(false) // Load next batch without reset
  }

  // Refresh products
  const refreshProducts = async () => {
    await refetchTotalSupply()
    await loadProducts(true) // Reset and reload
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || product.status === statusFilter
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean)
  const statuses = ['active', 'transferred', 'destroyed']

  const stats = [
    {
      name: 'Total Products',
      value: totalSupply,
      change: '+12%',
      changeType: 'increase',
      icon: Package,
      color: 'text-primary-600'
    },
    {
      name: 'Active Products',
      value: products.filter(p => p.status === 'active').length,
      change: '+8%',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'text-success-600'
    },
    {
      name: 'Transferred',
      value: products.filter(p => p.status === 'transferred').length,
      change: '+15%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-warning-600'
    },
    {
      name: 'Destroyed',
      value: products.filter(p => p.status === 'destroyed').length,
      change: '-5%',
      changeType: 'decrease',
      icon: XCircle,
      color: 'text-danger-600'
    }
  ]

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-success-100 text-success-700',
      transferred: 'bg-primary-100 text-primary-700',
      destroyed: 'bg-danger-100 text-danger-700'
    }
    return badges[status as keyof typeof badges] || 'bg-secondary-100 text-secondary-700'
  }

  if (!chainId) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-secondary-600">
            Please connect your wallet to view the admin dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-secondary-600">
            Manage products, track supply chain, and monitor system health
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <button
            onClick={refreshProducts}
            disabled={isLoading}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/create"
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stat.value}
                  </p>
                  <p className={`text-sm ${
                    stat.changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Create New Product</h3>
              <p className="text-primary-100 text-sm">Register a new item in the blockchain</p>
            </div>
            <Link to="/create" className="btn bg-white text-primary-600 hover:bg-primary-50">
              <Plus className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-r from-success-500 to-success-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Analytics</h3>
              <p className="text-success-100 text-sm">View detailed system analytics</p>
            </div>
            <button className="btn bg-white text-success-600 hover:bg-success-50">
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-r from-warning-500 to-warning-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">System Health</h3>
              <p className="text-warning-100 text-sm">Monitor blockchain connectivity</p>
            </div>
            <button className="btn bg-white text-warning-600 hover:bg-warning-50">
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products by name or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        <div className="lg:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-900">
            Product Management
          </h3>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mr-3" />
            <span className="text-secondary-600">Loading products from blockchain...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {filteredProducts.map((product) => (
                    <motion.tr
                      key={product.id.toString()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-secondary-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-secondary-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-secondary-500">
                              {product.geographicalOrigin}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-secondary-900">
                          {product.serialNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {product.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {formatDistanceToNow(new Date(Number(product.productionDate)), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Menu as="div" className="relative inline-block text-left">
                          <Menu.Button className="btn-secondary p-2">
                            <MoreVertical className="w-4 h-4" />
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
                              <Menu.Item>
                                {({ active }) => (
                                  <Link
                                    to={`/product/${product.id}`}
                                    className={`${
                                      active ? 'bg-secondary-100' : ''
                                    } group flex items-center px-3 py-2 text-sm text-secondary-900`}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Link>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    className={`${
                                      active ? 'bg-secondary-100' : ''
                                    } group flex w-full items-center px-3 py-2 text-sm text-secondary-900`}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Product
                                  </button>
                                )}
                              </Menu.Item>
                              {product.status !== 'destroyed' && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      className={`${
                                        active ? 'bg-danger-50' : ''
                                      } group flex w-full items-center px-3 py-2 text-sm text-danger-600`}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Destroy Product
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {loadedCount < totalSupply && (
              <div className="px-6 py-4 border-t border-secondary-200 text-center">
                <button
                  onClick={loadMoreProducts}
                  disabled={isLoadingMore}
                  className="btn-secondary"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading More...
                    </>
                  ) : (
                    <>
                      Load More ({loadedCount} of {totalSupply} loaded)
                    </>
                  )}
                </button>
              </div>
            )}

            {filteredProducts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">
                  No products found
                </h3>
                <p className="text-secondary-600">
                  {searchTerm || statusFilter || categoryFilter
                    ? 'Try adjusting your search or filter criteria.'
                    : totalSupply === 0
                    ? 'Create your first product to get started.'
                    : 'No products match your current filters.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}