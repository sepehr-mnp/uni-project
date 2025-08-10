import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Upload, 
  Package, 
  MapPin, 
  Hash, 
  Tag,
  FileText,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  File
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SUPPLY_CHAIN_ABI, getContractAddress, ProductFormData } from '../lib/contract'
import { uploadProductMetadata } from '../lib/ipfs'

export function CreateProduct() {
  const navigate = useNavigate()
  const { address, chainId } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    serialNumber: '',
    geographicalOrigin: '',
    quantity: 1,
    metadataComponents: [],
    recipient: address,
    images: [],
    documents: [],
    additionalMetadata: {}
  })

  const [metadataInput, setMetadataInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)

  const categories = [
    'Electronics',
    'Food & Beverage',
    'Fashion',
    'Pharmaceuticals',
    'Automotive',
    'Cosmetics',
    'Textiles',
    'Jewelry',
    'Furniture',
    'Books',
    'Toys',
    'Sports Equipment',
    'Other'
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required'
    }
    if (!formData.geographicalOrigin.trim()) {
      newErrors.geographicalOrigin = 'Geographical origin is required'
    }
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    }
    if (!formData.recipient) {
      newErrors.recipient = 'Recipient address is required'
    }
    if (formData.metadataComponents.length === 0) {
      newErrors.metadata = 'At least one metadata component is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddMetadata = () => {
    if (metadataInput.trim()) {
      setFormData(prev => ({
        ...prev,
        metadataComponents: [...prev.metadataComponents, metadataInput.trim()]
      }))
      setMetadataInput('')
    }
  }

  const handleRemoveMetadata = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metadataComponents: prev.metadataComponents.filter((_, i) => i !== index)
    }))
  }

  const handleImageUpload = (files: FileList | null) => {
    if (files) {
      const newImages = Array.from(files).filter(file => file.type.startsWith('image/'))
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImages]
      }))
    }
  }

  const handleDocumentUpload = (files: FileList | null) => {
    if (files) {
      const newDocuments = Array.from(files)
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...newDocuments]
      }))
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }))
  }

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents?.filter((_, i) => i !== index) || []
    }))
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

    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsUploading(true)
      
      // Upload metadata to IPFS
      console.log('Starting IPFS upload process...')
      toast.loading('Uploading metadata to IPFS...', { id: 'ipfs-upload' })
      
      const { metadataUrl, metadataHash } = await uploadProductMetadata(formData, address)
      
      console.log('IPFS upload successful:', { metadataUrl, metadataHash })
      toast.success('Metadata uploaded to IPFS successfully!', { id: 'ipfs-upload' })
      
      // Register product on blockchain
      console.log('Registering product on blockchain...')
      toast.loading('Creating product on blockchain...', { id: 'blockchain-tx' })
      
      const contractAddress = getContractAddress(chainId)
      
      writeContract({
        address: contractAddress,
        abi: SUPPLY_CHAIN_ABI,
        functionName: 'registerProduct',
        args: [
          formData.recipient!,
          formData.name,
          formData.category,
          formData.serialNumber,
          formData.geographicalOrigin,
          metadataUrl,
          metadataHash as `0x${string}`,
          BigInt(formData.quantity)
        ]
      })
      
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsUploading(false)
    }
  }

  // Handle success
  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Product created successfully!', { id: 'blockchain-tx' })
      setIsUploading(false)
      navigate('/admin')
    }
  }, [isSuccess, navigate])

  // Handle errors
  React.useEffect(() => {
    if (hash && !isPending && !isConfirming && !isSuccess) {
      setIsUploading(false)
    }
  }, [hash, isPending, isConfirming, isSuccess])

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
            Create New Product
          </h1>
          <p className="mt-1 text-secondary-600">
            Register a new product on the blockchain with IPFS metadata
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <Package className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">
                  Basic Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`input ${errors.name ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="e.g., iPhone 15 Pro"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-danger-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`input ${errors.category ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-danger-600">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    className={`input ${errors.serialNumber ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="e.g., IPHONE15P-2024-001"
                  />
                  {errors.serialNumber && (
                    <p className="mt-1 text-sm text-danger-600">{errors.serialNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Geographical Origin *
                  </label>
                  <input
                    type="text"
                    value={formData.geographicalOrigin}
                    onChange={(e) => setFormData(prev => ({ ...prev, geographicalOrigin: e.target.value }))}
                    className={`input ${errors.geographicalOrigin ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="e.g., Cupertino, CA, USA"
                  />
                  {errors.geographicalOrigin && (
                    <p className="mt-1 text-sm text-danger-600">{errors.geographicalOrigin}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className={`input ${errors.quantity ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="e.g., 100"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-danger-600">{errors.quantity}</p>
                  )}
                  <p className="mt-1 text-sm text-secondary-500">
                    Number of units to mint for this product
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={formData.recipient || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value as any }))}
                    className={`input ${errors.recipient ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="0x..."
                  />
                  {errors.recipient && (
                    <p className="mt-1 text-sm text-danger-600">{errors.recipient}</p>
                  )}
                  <p className="mt-1 text-sm text-secondary-500">
                    The wallet address that will receive the product token
                  </p>
                </div>
              </div>
            </div>

            {/* File Uploads */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <Upload className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">
                  Product Media
                </h2>
              </div>

              <div className="space-y-6">
                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Product Images
                  </label>
                  <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <ImageIcon className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                      <p className="text-secondary-600">Click to upload images</p>
                      <p className="text-sm text-secondary-500 mt-1">PNG, JPG, GIF up to 10MB each</p>
                    </label>
                  </div>
                  
                  {formData.images && formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Product ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full p-1 hover:bg-danger-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Supporting Documents
                  </label>
                  <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleDocumentUpload(e.target.files)}
                      className="hidden"
                      id="document-upload"
                    />
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <File className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                      <p className="text-secondary-600">Click to upload documents</p>
                      <p className="text-sm text-secondary-500 mt-1">PDF, DOC, TXT up to 10MB each</p>
                    </label>
                  </div>
                  
                  {formData.documents && formData.documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-secondary-50 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <File className="w-4 h-4 text-secondary-400" />
                            <span className="text-sm text-secondary-700">{doc.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="text-danger-600 hover:text-danger-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata Components */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">
                  Metadata Components
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Add Metadata Component *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={metadataInput}
                      onChange={(e) => setMetadataInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMetadata())}
                      className="input flex-1"
                      placeholder="e.g., Quality: Premium, Batch: 2024001, Weight: 250g"
                    />
                    <button
                      type="button"
                      onClick={handleAddMetadata}
                      disabled={!metadataInput.trim()}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {errors.metadata && (
                    <p className="mt-1 text-sm text-danger-600">{errors.metadata}</p>
                  )}
                  <p className="mt-1 text-sm text-secondary-500">
                    Add specific details about the product that will be hashed for verification
                  </p>
                </div>

                {formData.metadataComponents.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Current Metadata Components
                    </label>
                    <div className="space-y-2">
                      {formData.metadataComponents.map((component, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between bg-secondary-50 rounded-lg p-3"
                        >
                          <span className="text-sm text-secondary-700">{component}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMetadata(index)}
                            className="text-danger-600 hover:text-danger-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || isConfirming || isUploading}
                className="btn-primary"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isPending || isConfirming ? 'Creating...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Create Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview & Help */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Product Preview
            </h3>
            <div className="space-y-4">
              <div className="w-full h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                {formData.images && formData.images.length > 0 ? (
                  <img
                    src={URL.createObjectURL(formData.images[0])}
                    alt="Product preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="w-12 h-12 text-primary-400" />
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-secondary-900">
                  {formData.name || 'Product Name'}
                </h4>
                <div className="flex items-center text-sm text-secondary-600">
                  <Tag className="w-3 h-3 mr-1" />
                  {formData.category || 'Category'}
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <Hash className="w-3 h-3 mr-1" />
                  {formData.serialNumber || 'Serial Number'}
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  {formData.geographicalOrigin || 'Origin'}
                </div>
                {formData.images && formData.images.length > 0 && (
                  <div className="flex items-center text-sm text-secondary-600">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {formData.images.length} image{formData.images.length > 1 ? 's' : ''}
                  </div>
                )}
                {formData.documents && formData.documents.length > 0 && (
                  <div className="flex items-center text-sm text-secondary-600">
                    <File className="w-3 h-3 mr-1" />
                    {formData.documents.length} document{formData.documents.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="card bg-primary-50 border-primary-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-primary-900 mb-2">
                  Important Notes
                </h3>
                <ul className="text-sm text-primary-700 space-y-1">
                  <li>• All fields marked with * are required</li>
                  <li>• Serial numbers should be unique</li>
                  <li>• Files will be uploaded to IPFS for decentralized storage</li>
                  <li>• Metadata will be hashed using Keccak256</li>
                  <li>• Product creation requires MANUFACTURER_ROLE</li>
                  <li>• Transaction will be recorded on the blockchain</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}