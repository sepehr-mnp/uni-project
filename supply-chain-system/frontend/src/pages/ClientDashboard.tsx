import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { config } from '../lib/wagmi'
import { motion } from 'framer-motion'
import { 
  Package, 
  Send, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  MapPin,
  User,
  Hash,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { SUPPLY_CHAIN_ABI, getContractAddress, Product } from '../lib/contract'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'

export function ClientDashboard() {
  const { address, chainId } = useAccount()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ownedCount, setOwnedCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const PRODUCTS_PER_PAGE = 10

  // Read next token ID from contract (total products = nextTokenId - 1)
  const { data: contractNextTokenId, refetch: refetchTotalSupply } = useReadContract({
    address: chainId ? getContractAddress(chainId) : undefined,
    abi: SUPPLY_CHAIN_ABI,
    functionName: 'nextTokenId',
    query: {
      enabled: !!chainId
    }
  })

  // Function to get the count of owned products
  const getOwnedProductsCount = async () => {
    if (!chainId || !address) return 0

    const contractAddress = getContractAddress(chainId)

    try {
      const count = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: SUPPLY_CHAIN_ABI,
        functionName: 'getOwnedProductsCount',
        args: [address as `0x${string}`]
      })
      
      return Number(count)
    } catch (error) {
      console.error('Error getting owned products count:', error)
      return 0
    }
  }

  // Function to load user's products from blockchain using new mapping-based approach
  const loadUserProducts = async (reset: boolean = false) => {
    if (!chainId || !address) return

    if (reset) {
      setIsLoading(true)
      setCurrentPage(0)
      setProducts([])
    } else {
      setIsLoadingMore(true)
    }

    const contractAddress = getContractAddress(chainId)

    try {
      // First get the count of owned products
      const count = await getOwnedProductsCount()
      setOwnedCount(count)

      if (count === 0) {
        setProducts([])
        return
      }

      const startIndex = reset ? 0 : currentPage * PRODUCTS_PER_PAGE
      const loadCount = Math.min(PRODUCTS_PER_PAGE, count - startIndex)

      if (loadCount <= 0) {
        return // No more products to load
      }

      // Load products based on count
      let batchResult: any
      
      // If count <= 10 and this is the first load, get all products at once
      if (count <= 10 && reset) {
        batchResult = await readContract(config, {
          address: contractAddress as `0x${string}`,
          abi: SUPPLY_CHAIN_ABI,
          functionName: 'getAllOwnedProducts',
          args: [address as `0x${string}`]
        })
      } else {
        batchResult = await readContract(config, {
          address: contractAddress as `0x${string}`,
          abi: SUPPLY_CHAIN_ABI,
          functionName: 'getOwnedProductsBatch',
          args: [address as `0x${string}`, BigInt(startIndex), BigInt(loadCount)]
        })
      }
      
      const [ownedProducts, tokenIds] = batchResult as [any[], any[]]

      const userProducts: Product[] = ownedProducts.map((productData: any, index: number) => ({
        id: BigInt(productData.id),
        name: productData.name,
        category: productData.category,
        serialNumber: productData.serialNumber,
        productionDate: BigInt(productData.productionDate),
        geographicalOrigin: productData.geographicalOrigin,
        metadataHash: productData.metadataHash,
        metadataUrl: productData.metadataUrl,
        manufacturer: productData.manufacturer,
        exists: productData.exists
      }))

      if (reset) {
        setProducts(userProducts)
      } else {
        setProducts(prev => [...prev, ...userProducts])
      }

      if (!reset) {
        setCurrentPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error loading user products:', error)
      toast.error('Failed to load your products from blockchain')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Load products when component mounts or dependencies change
  useEffect(() => {
    loadUserProducts(true)
  }, [chainId, address])

  // Refresh products
  const refreshProducts = async () => {
    await refetchTotalSupply()
    await loadUserProducts(true)
  }

  // Load more products
  const loadMoreProducts = async () => {
    if (products.length < ownedCount && !isLoadingMore) {
      await loadUserProducts(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean)

  const stats = [
    {
      name: 'Total Products',
      value: ownedCount,
      icon: Package,
      color: 'text-primary-600'
    },
    {
      name: 'Active Products',
      value: products.filter(p => p.exists).length,
      icon: Eye,
      color: 'text-success-600'
    },
    {
      name: 'Categories',
      value: categories.length,
      icon: Filter,
      color: 'text-warning-600'
    }
  ]

  if (!chainId) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-secondary-600">
            Please connect your wallet to view your products.
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
            My Products
          </h1>
          <p className="mt-1 text-secondary-600">
            Manage and track your blockchain-verified products
          </p>
        </div>
        <button
          onClick={refreshProducts}
          disabled={isLoading}
          className="mt-4 sm:mt-0 btn-secondary"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
        <div className="sm:w-48">
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

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mr-3" />
          <span className="text-secondary-600">Loading your products from blockchain...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            No products found
          </h3>
          <p className="text-secondary-600">
            {searchTerm || categoryFilter
              ? 'Try adjusting your search or filter criteria.'
              : products.length === 0
              ? 'You don\'t have any products yet. Products will appear here when you receive or purchase them.'
              : 'No products match your current filters.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              {/* Product Image Placeholder */}
              <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center">
                <Package className="w-16 h-16 text-primary-400" />
              </div>

              {/* Product Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-secondary-900 truncate">
                    {product.name}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                    {product.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-secondary-600">
                    <Hash className="w-4 h-4 mr-2" />
                    <span className="font-mono">{product.serialNumber}</span>
                  </div>
                  <div className="flex items-center text-sm text-secondary-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{product.geographicalOrigin}</span>
                  </div>
                  <div className="flex items-center text-sm text-secondary-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {formatDistanceToNow(new Date(Number(product.productionDate)), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-secondary-600">
                    <User className="w-4 h-4 mr-2" />
                    <span className="font-mono text-xs truncate">
                      {product.manufacturer}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4">
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-1 btn-secondary text-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                  <Link
                    to={`/transfer/${product.id}`}
                    className="flex-1 btn-primary text-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Transfer
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {products.length < ownedCount && !isLoading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMoreProducts}
            disabled={isLoadingMore}
            className="btn-secondary"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More Products ({ownedCount - products.length} remaining)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}