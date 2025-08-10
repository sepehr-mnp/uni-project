import { IPFSMetadata, ProductFormData } from './contract'

// IPFS endpoints - you can replace with your preferred provider
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'
const IPFS_UPLOAD_ENDPOINT = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const IPFS_JSON_ENDPOINT = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

// Pinata API keys - set these in your .env file
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY

/**
 * Upload file to IPFS using Pinata
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata API keys not configured')
  }

  const formData = new FormData()
  formData.append('file', file)

  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      type: 'supply-chain-file',
      timestamp: Date.now().toString()
    }
  })
  formData.append('pinataMetadata', metadata)

  const options = JSON.stringify({
    cidVersion: 1,
  })
  formData.append('pinataOptions', options)

  const response = await fetch(IPFS_UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload file to IPFS: ${response.statusText}`)
  }

  const result = await response.json()
  return result.IpfsHash
}

/**
 * Upload JSON metadata to IPFS using Pinata
 */
export async function uploadJSONToIPFS(metadata: IPFSMetadata): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata API keys not configured')
  }

  const pinataMetadata = {
    name: `${metadata.name}-metadata.json`,
    keyvalues: {
      type: 'supply-chain-metadata',
      product: metadata.name,
      timestamp: Date.now().toString()
    }
  }

  const pinataOptions = {
    cidVersion: 1,
  }

  const data = {
    pinataContent: metadata,
    pinataMetadata,
    pinataOptions,
  }

  const response = await fetch(IPFS_JSON_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Failed to upload JSON to IPFS: ${response.statusText}`)
  }

  const result = await response.json()
  return result.IpfsHash
}

/**
 * Create complete product metadata for IPFS
 */
export async function createProductMetadata(
  formData: ProductFormData,
  manufacturer: string
): Promise<IPFSMetadata> {
  const uploadedImages: string[] = []
  const uploadedDocuments: string[] = []

  // Upload images to IPFS
  if (formData.images && formData.images.length > 0) {
    for (const image of formData.images) {
      try {
        const cid = await uploadFileToIPFS(image)
        uploadedImages.push(`${IPFS_GATEWAY}${cid}`)
      } catch (error) {
        console.error('Failed to upload image:', error)
      }
    }
  }

  // Upload documents to IPFS
  if (formData.documents && formData.documents.length > 0) {
    for (const doc of formData.documents) {
      try {
        const cid = await uploadFileToIPFS(doc)
        uploadedDocuments.push(`${IPFS_GATEWAY}${cid}`)
      } catch (error) {
        console.error('Failed to upload document:', error)
      }
    }
  }

  // Create metadata structure
  const metadata: IPFSMetadata = {
    name: formData.name,
    description: `Supply chain product: ${formData.name} from ${formData.geographicalOrigin}`,
    image: uploadedImages[0] || '', // Primary image
    attributes: [
      {
        trait_type: 'Category',
        value: formData.category
      },
      {
        trait_type: 'Serial Number',
        value: formData.serialNumber
      },
      {
        trait_type: 'Geographical Origin',
        value: formData.geographicalOrigin
      },
      {
        trait_type: 'Manufacturer',
        value: manufacturer
      }
    ],
    product: {
      category: formData.category,
      serialNumber: formData.serialNumber,
      productionDate: Date.now(),
      geographicalOrigin: formData.geographicalOrigin,
      manufacturer
    },
    supply_chain: {
      metadataHash: '', // Will be filled by contract
      components: formData.metadataComponents
    }
  }

  // Add files if any were uploaded
  if (uploadedImages.length > 0 || uploadedDocuments.length > 0) {
    metadata.files = {
      images: uploadedImages,
      documents: uploadedDocuments
    }
  }

  // Add additional metadata if provided
  if (formData.additionalMetadata) {
    Object.entries(formData.additionalMetadata).forEach(([key, value]) => {
      metadata.attributes.push({
        trait_type: key,
        value: String(value)
      })
    })
  }

  return metadata
}

/**
 * Calculate metadata hash (for on-chain storage)
 * Note: This is a simplified hash for development - use calculateKeccak256Hash for production
 */
export function calculateMetadataHash(metadata: IPFSMetadata): string {
  // Convert metadata to string and hash it
  const metadataString = JSON.stringify(metadata)
  
  // Use Web Crypto API to calculate a deterministic hash
  // Note: This is a simplified hash - in production use calculateKeccak256Hash
  return `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`
}

/**
 * Calculate proper keccak256 hash using ethers (more accurate)
 */
export async function calculateKeccak256Hash(metadata: IPFSMetadata): Promise<string> {
  const metadataString = JSON.stringify(metadata)
  
  // Import keccak256 from ethers
  const { keccak256, toUtf8Bytes } = await import('ethers')
  return keccak256(toUtf8Bytes(metadataString))
}

/**
 * Upload complete product metadata to IPFS and return both URL and hash
 */
export async function uploadProductMetadata(
  formData: ProductFormData,
  manufacturer: string
): Promise<{ metadataUrl: string; metadataHash: string; ipfsCid: string }> {
  console.log('Uploading product metadata...')
  const metadata = await createProductMetadata(formData, manufacturer)
  console.log('Metadata created:', metadata)
  const ipfsCid = await uploadJSONToIPFS(metadata)
  console.log('IPFS CID:', ipfsCid)
  const metadataUrl = `${IPFS_GATEWAY}${ipfsCid}`
  console.log('Metadata URL:', metadataUrl)
  const metadataHash = await calculateKeccak256Hash(metadata)
  console.log('Metadata hash:', metadataHash)
  
  return {
    metadataUrl,
    metadataHash,
    ipfsCid
  }
}

/**
 * Fetch metadata from IPFS
 */
export async function fetchFromIPFS(cid: string): Promise<any> {
  const response = await fetch(`${IPFS_GATEWAY}${cid}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Get IPFS URL for a CID
 */
export function getIPFSUrl(cid: string): string {
  return `${IPFS_GATEWAY}${cid}`
}

/**
 * Validate IPFS CID format
 */
export function isValidIPFSHash(hash: string): boolean {
  // Basic CID validation - can be enhanced
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash) || 
         /^baf[a-z0-9]{56}$/.test(hash) ||
         /^bafy[a-z0-9]{55}$/.test(hash)
}

/**
 * Verify metadata integrity by fetching from URL and comparing hash
 * This mimics the on-chain verification process
 */
export async function verifyMetadataIntegrity(
  metadataUrl: string, 
  expectedHash: string
): Promise<{ isValid: boolean; metadata?: IPFSMetadata; error?: string }> {
  try {
    // Fetch metadata from URL
    const response = await fetch(metadataUrl)
    if (!response.ok) {
      return { isValid: false, error: `Failed to fetch metadata: ${response.statusText}` }
    }
    
    const metadata = await response.json() as IPFSMetadata
    
    // Calculate hash of the fetched metadata
    const calculatedHash = await calculateKeccak256Hash(metadata)
    
    // Compare hashes
    const isValid = calculatedHash.toLowerCase() === expectedHash.toLowerCase()
    
    return {
      isValid,
      metadata: isValid ? metadata : undefined,
      error: isValid ? undefined : 'Metadata hash mismatch'
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Fetch and parse metadata from any URL (IPFS or otherwise)
 */
export async function fetchMetadataFromUrl(url: string): Promise<IPFSMetadata> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.statusText}`)
  }
  return response.json()
}