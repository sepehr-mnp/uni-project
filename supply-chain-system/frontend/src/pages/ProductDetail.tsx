import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { config } from '../lib/wagmi'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Package, 
  Send, 
  Download,
  ExternalLink,
  MapPin,
  Calendar,
  Hash,
  User,
  Shield,
  CheckCircle,
  AlertTriangle,
  Copy,
  Clock,
  Tag,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { toast } from 'react-hot-toast'
import { SUPPLY_CHAIN_ABI, getContractAddress, Product, OwnershipRecord } from '../lib/contract'
import { formatDistanceToNow, format } from 'date-fns'
import { fetchMetadataFromUrl, verifyMetadataIntegrity } from '../lib/ipfs'

export function ProductDetail() {
  const { tokenId } = useParams<{ tokenId: string }>()
  const navigate = useNavigate()
  const { address, chainId } = useAccount()
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'verify'>('details')
  const [product, setProduct] = useState<Product | null>(null)
  const [ownershipHistory, setOwnershipHistory] = useState<OwnershipRecord[]>([])
  const [currentOwner, setCurrentOwner] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [metadataComponents, setMetadataComponents] = useState<string[]>([])
  const [metadataVerified, setMetadataVerified] = useState<boolean | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const contractAddress = chainId ? getContractAddress(chainId) : null

  // Load product data
  useEffect(() => {
    const loadProductData = async () => {
      if (!chainId || !tokenId || !contractAddress) return

      setIsLoading(true)
      try {
        const tokenIdBigInt = BigInt(tokenId)

        // Check if product exists
        const exists = await readContract(config, {
          address: contractAddress as `0x${string}`,
          abi: SUPPLY_CHAIN_ABI,
          functionName: 'exists',
          args: [tokenIdBigInt]
        })
        
        if (!exists) {
          toast.error('Product not found')
          navigate('/admin')
          return
        }

        // Get product details
        const productData = await readContract(config, {
          address: contractAddress as `0x${string}`,
          abi: SUPPLY_CHAIN_ABI,
          functionName: 'products',
          args: [tokenIdBigInt]
        }) as any[]
        
        if (productData) {
          const productInfo: Product = {
            id: productData[0],
            name: productData[1],
            category: productData[2],
            serialNumber: productData[3],
            productionDate: productData[4],
            geographicalOrigin: productData[5],
            metadataHash: productData[6],
            metadataUrl: productData[7],
            manufacturer: productData[8],
            exists: productData[9]
          }
          setProduct(productInfo)

          // Load metadata from IPFS if available
          if (productInfo.metadataUrl) {
            try {
              const metadata = await fetchMetadataFromUrl(productInfo.metadataUrl)
              if (metadata.supply_chain?.components) {
                setMetadataComponents(metadata.supply_chain.components)
              }
            } catch (error) {
              console.warn('Failed to load metadata from IPFS:', error)
            }
          }
        }

        // Note: getCurrentOwner and getAllOwners functions were removed from contract
        // ERC1155 tokens can have multiple owners with different amounts
        // For ownership information, use balanceOf(address, tokenId) to check specific ownership
        // Ownership history and current owner features are disabled for now

      } catch (error) {
        console.error('Error loading product data:', error)
        toast.error('Failed to load product data')
      } finally {
        setIsLoading(false)
      }
    }

    loadProductData()
  }, [chainId, tokenId, contractAddress, navigate])

  // Verify metadata integrity
  const verifyMetadata = async () => {
    if (!product?.metadataUrl || !product?.metadataHash) return

    setIsVerifying(true)
    try {
      const result = await verifyMetadataIntegrity(product.metadataUrl, product.metadataHash)
      setMetadataVerified(result.isValid)
      
      if (result.isValid) {
        toast.success('Metadata verified successfully!')
      } else {
        toast.error(`Metadata verification failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error verifying metadata:', error)
      toast.error('Failed to verify metadata')
      setMetadataVerified(false)
    } finally {
      setIsVerifying(false)
    }
  }

  const isCurrentOwner = currentOwner?.toLowerCase() === address?.toLowerCase()

  const qrCodeData = product ? {
    tokenId: tokenId,
    name: product.name,
    serialNumber: product.serialNumber,
    manufacturer: product.manufacturer,
    metadataHash: product.metadataHash,
    url: `${window.location.origin}/product/${tokenId}`
  } : {}

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const tabs = [
    { id: 'details', name: 'Product Details', icon: Package },
    { id: 'history', name: 'Ownership History', icon: Clock },
    { id: 'verify', name: 'Verify Metadata', icon: Shield }
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
            Please connect your wallet to view product details.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Loading Product
          </h3>
          <p className="text-secondary-600">
            Fetching product data from blockchain...
          </p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Product Not Found
          </h3>
          <p className="text-secondary-600">
            The requested product could not be found.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              {product.name}
            </h1>
            <p className="mt-1 text-secondary-600">
              Token ID: #{tokenId} • {product.category}
            </p>
          </div>
        </div>

        {isCurrentOwner && (
          <Link
            to={`/transfer/${tokenId}`}
            className="btn-primary"
          >
            <Send className="w-4 h-4 mr-2" />
            Transfer Product
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Overview */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">
                Product Overview
              </h2>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="text-sm font-medium text-success-700">
                  Blockchain Verified
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Hash className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Serial Number</p>
                    <p className="font-mono text-secondary-900">{product.serialNumber}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Origin</p>
                    <p className="text-secondary-900">{product.geographicalOrigin}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Production Date</p>
                    <p className="text-secondary-900">
                      {format(new Date(Number(product.productionDate)), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Manufacturer</p>
                    <p className="font-mono text-secondary-900 text-sm">
                      {product.manufacturer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Tag className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Current Owner</p>
                    <p className="font-mono text-secondary-900 text-sm">
                      {currentOwner || 'Loading...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Metadata Hash</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-mono text-secondary-900 text-xs truncate">
                        {product.metadataHash}
                      </p>
                      <button
                        onClick={() => copyToClipboard(product.metadataHash)}
                        className="text-secondary-400 hover:text-secondary-600"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="border-b border-secondary-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'details' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Metadata Components
                  </h3>
                  {metadataComponents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {metadataComponents.map((component, index) => (
                        <div
                          key={index}
                          className="bg-secondary-50 rounded-lg p-3 border border-secondary-200"
                        >
                          <span className="text-sm text-secondary-700">{component}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                      <p className="text-secondary-600">
                        {product.metadataUrl ? 'Loading metadata components...' : 'No metadata components available'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Transfer History
                  </h3>
                  {ownershipHistory.length > 0 ? (
                    <div className="space-y-4">
                      {ownershipHistory.map((record, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-4 p-4 bg-secondary-50 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-secondary-900">
                                {record.transferReason}
                              </p>
                              <p className="text-sm text-secondary-500">
                                {formatDistanceToNow(new Date(Number(record.timestamp)), { addSuffix: true })}
                              </p>
                            </div>
                            <p className="text-sm font-mono text-secondary-600 mt-1">
                              Owner: {record.owner}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                      <p className="text-secondary-600">No ownership history available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'verify' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                      Metadata Verification
                    </h3>
                    
                    {product.metadataUrl ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-secondary-600">
                            Verify that the metadata hasn't been tampered with
                          </p>
                          <button
                            onClick={verifyMetadata}
                            disabled={isVerifying}
                            className="btn-primary"
                          >
                            {isVerifying ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              'Verify Metadata'
                            )}
                          </button>
                        </div>

                        {metadataVerified !== null && (
                          <div className={`border rounded-lg p-4 ${
                            metadataVerified 
                              ? 'bg-success-50 border-success-200' 
                              : 'bg-danger-50 border-danger-200'
                          }`}>
                            <div className="flex items-center space-x-2">
                              {metadataVerified ? (
                                <CheckCircle className="w-5 h-5 text-success-500" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-danger-500" />
                              )}
                              <span className={`font-medium ${
                                metadataVerified ? 'text-success-800' : 'text-danger-800'
                              }`}>
                                {metadataVerified ? 'Metadata Verified' : 'Verification Failed'}
                              </span>
                            </div>
                            <p className={`text-sm mt-2 ${
                              metadataVerified ? 'text-success-700' : 'text-danger-700'
                            }`}>
                              {metadataVerified 
                                ? 'The product metadata hash matches the blockchain record, confirming authenticity.'
                                : 'The metadata hash does not match the blockchain record. This product may have been tampered with.'
                              }
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium text-secondary-900 mb-2">Hash Comparison</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                              <span className="text-sm text-secondary-600">Blockchain Hash:</span>
                              <span className="font-mono text-xs text-secondary-900">
                                {product.metadataHash}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                              <span className="text-sm text-secondary-600">IPFS URL:</span>
                              <a
                                href={product.metadataUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                              >
                                View Metadata
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                        <p className="text-secondary-600">No metadata URL available for verification</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Product QR Code
            </h3>
            <div className="bg-white p-4 rounded-lg border border-secondary-200 flex justify-center">
              <QRCode
                size={200}
                value={JSON.stringify(qrCodeData)}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            <p className="text-sm text-secondary-600 mt-3 text-center">
              Scan to verify product authenticity
            </p>
            <button
              onClick={() => copyToClipboard(JSON.stringify(qrCodeData, null, 2))}
              className="w-full btn-secondary mt-3"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy QR Data
            </button>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {isCurrentOwner && (
                <Link
                  to={`/transfer/${tokenId}`}
                  className="w-full btn-primary"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Transfer Product
                </Link>
              )}
              
              <button className="w-full btn-secondary">
                <Download className="w-4 h-4 mr-2" />
                Download Certificate
              </button>
              
              <button
                onClick={() => copyToClipboard(window.location.href)}
                className="w-full btn-secondary"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Share Product
              </button>
            </div>
          </div>

          {/* Product Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Product Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Authenticity</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  <span className="text-sm font-medium text-success-700">Verified</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Ownership</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  <span className="text-sm font-medium text-success-700">Valid</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Transfers</span>
                <span className="text-sm font-medium text-secondary-900">
                  {ownershipHistory.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Metadata</span>
                <div className="flex items-center space-x-1">
                  {metadataVerified === null ? (
                    <span className="text-sm font-medium text-secondary-700">Not Verified</span>
                  ) : metadataVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-success-500" />
                      <span className="text-sm font-medium text-success-700">Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-danger-500" />
                      <span className="text-sm font-medium text-danger-700">Failed</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}