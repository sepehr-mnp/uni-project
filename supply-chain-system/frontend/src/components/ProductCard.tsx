import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Package, 
  Send, 
  Eye, 
  Calendar,
  MapPin,
  Hash,
  User
} from 'lucide-react'
import { Product } from '../lib/contract'
import { formatDistanceToNow } from 'date-fns'

interface ProductCardProps {
  product: Product
  showActions?: boolean
  className?: string
}

export function ProductCard({ product, showActions = true, className = '' }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`card hover:shadow-lg transition-all duration-200 ${className}`}
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
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            product.exists 
              ? 'bg-success-100 text-success-700'
              : 'bg-danger-100 text-danger-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              product.exists ? 'bg-success-500' : 'bg-danger-500'
            }`} />
            <span>{product.exists ? 'Active' : 'Destroyed'}</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2 pt-4">
            <Link
              to={`/product/${product.id}`}
              className="flex-1 btn-secondary text-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Link>
            {product.exists && (
              <Link
                to={`/transfer/${product.id}`}
                className="flex-1 btn-primary text-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Transfer
              </Link>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
} 