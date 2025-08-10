import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Send, 
  AlertCircle, 
  CheckCircle,
  User,
  FileText,
  Hash,
  Loader2,
  Package,
  Shield,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SUPPLY_CHAIN_ABI, getContractAddress, Product } from '../lib/contract'
import { isAddress } from 'viem'

export function TransferProduct() {
  const { tokenId } = useParams<{ tokenId: string }>()
  const navigate = useNavigate()
  const { address, chainId } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [formData, setFormData] = useState({
    recipientAddress: '',
    transferReason: '',
    confirmTransfer: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mock product data
  const mockProduct: Product = {
    id: BigInt(tokenId || '1'),
    name: "iPhone 15 Pro",
    category: "Electronics",
    serialNumber: "IPH15P-001",
    productionDate: BigInt(Date.now() - 86400000 * 30),
    geographicalOrigin: "Cupertino, CA",
    metadataHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    manufacturer: "0x1234567890123456789012345678901234567890" as any,
    exists: true
  }

  const transferReasons = [
    'Sale',
    'Gift',
    'Wholesale Distribution',
    'Retail Distribution',
    'Return/Exchange',
    'Warranty Replacement',
    'Internal Transfer',
    'Other'
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.recipientAddress.trim()) {
      newErrors.recipientAddress = 'Recipient address is required'
    } else if (!isAddress(formData.recipientAddress)) {
      newErrors.recipientAddress = 'Invalid Ethereum address'
    } else if (formData.recipientAddress.toLowerCase() === address?.toLowerCase()) {
      newErrors.recipientAddress = 'Cannot transfer to yourself'
    }

    if (!formData.transferReason.trim()) {
      newErrors.transferReason = 'Transfer reason is required'
    }

    if (!formData.confirmTransfer) {
      newErrors.confirmTransfer = 'Please confirm that you want to transfer this product'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    if (!chainId) {
      toast.error('Please connect to a supported network')
      return
    }

    try {
      const contractAddress = getContractAddress(chainId)
      
      writeContract({
        address: contractAddress,
        abi: SUPPLY_CHAIN_ABI,
        functionName: 'transferWithTax',
        args: [
          address!,
          formData.recipientAddress as any,
          BigInt(tokenId!),
          formData.transferReason
        ]
      })
    } catch (error) {
      console.error('Error transferring product:', error)
      toast.error('Failed to transfer product')
    }
  }

  // Handle success
  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Product transferred successfully!')
      navigate(`/product/${tokenId}`)
    }
  }, [isSuccess, navigate, tokenId])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Transfer Product
          </h1>
          <p className="mt-1 text-secondary-600">
            Transfer ownership of {mockProduct.name} to another wallet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transfer Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Information */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <Package className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">
                  Product Information
                </h2>
              </div>

              <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {mockProduct.name}
                    </h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-secondary-600">
                        <Hash className="w-3 h-3 mr-2" />
                        <span>Serial: {mockProduct.serialNumber}</span>
                      </div>
                      <div className="flex items-center text-sm text-secondary-600">
                        <span className="w-3 h-3 mr-2 bg-success-500 rounded-full"></span>
                        <span>Token ID: #{tokenId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer Details */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <Send className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">
                  Transfer Details
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Recipient Address *
                  </label>
                  <input
                    type="text"
                    value={formData.recipientAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))}
                    className={`input ${errors.recipientAddress ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="0x..."
                  />
                  {errors.recipientAddress && (
                    <p className="mt-1 text-sm text-danger-600">{errors.recipientAddress}</p>
                  )}
                  <p className="mt-1 text-sm text-secondary-500">
                    Enter the Ethereum wallet address of the new owner
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Transfer Reason *
                  </label>
                  <select
                    value={formData.transferReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, transferReason: e.target.value }))}
                    className={`input ${errors.transferReason ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  >
                    <option value="">Select a reason</option>
                    {transferReasons.map(reason => (
                      <option key={reason} value={reason.toLowerCase()}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  {errors.transferReason && (
                    <p className="mt-1 text-sm text-danger-600">{errors.transferReason}</p>
                  )}
                  <p className="mt-1 text-sm text-secondary-500">
                    This will be recorded in the product's ownership history
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">
                  Confirmation
                </h2>
              </div>

              <div className="space-y-4">
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-warning-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-warning-800 mb-2">
                        Important Notice
                      </h3>
                      <ul className="text-sm text-warning-700 space-y-1">
                        <li>• This transfer is permanent and cannot be undone</li>
                        <li>• You will lose ownership of this product</li>
                        <li>• Gas fees will be charged for the transaction</li>
                        <li>• The transfer will be recorded on the blockchain</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="confirmTransfer"
                    checked={formData.confirmTransfer}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmTransfer: e.target.checked }))}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor="confirmTransfer" className="text-sm text-secondary-700">
                    I understand that this transfer is permanent and I want to transfer ownership of this product to the specified address.
                  </label>
                </div>
                {errors.confirmTransfer && (
                  <p className="text-sm text-danger-600">{errors.confirmTransfer}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="btn-primary"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isPending ? 'Transferring...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Transfer Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Transfer Preview */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Transfer Preview
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-secondary-200">
                <span className="text-sm text-secondary-600">From</span>
                <span className="text-sm font-mono text-secondary-900">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Your Wallet'}
                </span>
              </div>
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                  <Send className="w-4 h-4 text-primary-600" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-secondary-200">
                <span className="text-sm text-secondary-600">To</span>
                <span className="text-sm font-mono text-secondary-900">
                  {formData.recipientAddress 
                    ? `${formData.recipientAddress.slice(0, 6)}...${formData.recipientAddress.slice(-4)}`
                    : 'Recipient Address'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-secondary-600">Reason</span>
                <span className="text-sm text-secondary-900">
                  {formData.transferReason || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Gas Estimation */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Transaction Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Network</span>
                <span className="text-sm font-medium text-secondary-900">
                  {chainId === 1337 ? 'Localhost' : 'Ethereum'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Estimated Gas</span>
                <span className="text-sm font-medium text-secondary-900">
                  ~0.003 ETH
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Transaction Type</span>
                <span className="text-sm font-medium text-secondary-900">
                  ERC1155 Transfer
                </span>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="card bg-primary-50 border-primary-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-primary-900 mb-2">
                  Need Help?
                </h3>
                <ul className="text-sm text-primary-700 space-y-1">
                  <li>• Double-check the recipient address</li>
                  <li>• Ensure you have enough ETH for gas</li>
                  <li>• Transfer will be recorded permanently</li>
                  <li>• Contact support if you need assistance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 