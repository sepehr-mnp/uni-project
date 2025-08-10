# ERC1155 Supply Chain Management System

A comprehensive blockchain-based supply chain management system built with ERC1155 tokens, featuring metadata hash verification and complete ownership tracing.

## Features

- **ERC1155 Token Standard**: Efficient multi-token standard for representing products
- **Metadata Hash Verification**: Uses Keccak256 to ensure product authenticity
- **Complete Ownership Tracing**: Track products from manufacture to final consumer
- **Role-Based Access Control**: Different permissions for manufacturers, distributors, retailers, and customs
- **Pausable Operations**: Emergency stop functionality for contract security
- **Tax Calculation**: Automatic tax computation on transfers
- **Product Lifecycle Management**: Full product registration, transfer, and destruction capabilities

## Architecture

### Smart Contract Components

1. **SupplyChainERC1155.sol**: Main contract implementing:
   - Product registration and minting
   - Ownership transfer with tax calculation
   - Metadata verification using Keccak256 hashing
   - Complete ownership history tracking
   - Role-based permissions
   - Product destruction for counterfeit handling

### Product Structure

```solidity
struct Product {
    uint256 id;
    string name;
    string category;
    string serialNumber;
    uint256 productionDate;
    string geographicalOrigin;
    bytes32 metadataHash; // Keccak256 hash for verification
    address manufacturer;
    bool exists;
}
```

### Ownership Tracking

```solidity
struct OwnershipRecord {
    address owner;
    uint256 timestamp;
    string transferReason;
}
```

## Roles and Permissions

- **DEFAULT_ADMIN_ROLE**: Can manage all roles and pause/unpause contract
- **MANUFACTURER_ROLE**: Can register new products
- **DISTRIBUTOR_ROLE**: Can participate in the supply chain (future features)
- **RETAILER_ROLE**: Can participate in the supply chain (future features)
- **CUSTOMS_ROLE**: Can destroy counterfeit products

## Key Functions

### Product Registration
```solidity
function registerProduct(
    address to,
    string memory name,
    string memory category,
    string memory serialNumber,
    string memory geographicalOrigin,
    string[] memory metadataComponents
) external onlyRole(MANUFACTURER_ROLE) returns (uint256)
```

### Transfer with Tax
```solidity
function transferWithTax(
    address from,
    address to,
    uint256 tokenId,
    string memory transferReason
) external
```

### Metadata Verification
```solidity
function verifyProductMetadata(
    uint256 tokenId,
    string[] memory providedMetadataComponents
) external view returns (bool)
```

### Ownership Tracking
```solidity
function getOwnershipHistory(uint256 tokenId) external view returns (OwnershipRecord[] memory)
function getCurrentOwner(uint256 tokenId) external view returns (address)
function getAllOwners(uint256 tokenId) external view returns (address[] memory)
```

## Installation and Setup

### Prerequisites
- [Foundry](https://book.getfoundry.sh/)
- Node.js (for frontend development)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd supply-chain-system
   ```

2. Install dependencies:
   ```bash
   forge install
   ```

3. Compile contracts:
   ```bash
   forge build
   ```

4. Run tests:
   ```bash
   forge test
   ```

## Usage

### Deployment

1. Set up environment variables:
   ```bash
   # .env file
   PRIVATE_KEY=your_private_key_here
   RPC_URL=your_rpc_url_here
   ```

2. Deploy the contract:
   ```bash
   forge script script/DeploySupplyChain.s.sol --rpc-url $RPC_URL --broadcast
   ```

3. Set up roles (optional):
   ```bash
   # Set environment variables for role addresses
   CONTRACT_ADDRESS=deployed_contract_address
   MANUFACTURER1_ADDRESS=manufacturer_address
   DISTRIBUTOR_ADDRESS=distributor_address
   RETAILER_ADDRESS=retailer_address
   CUSTOMS_ADDRESS=customs_address
   
   # Run role setup script
   forge script script/DeploySupplyChain.s.sol:SetupRoles --rpc-url $RPC_URL --broadcast
   ```

### Example Usage Flow

1. **Product Registration** (Manufacturer):
   ```solidity
   string[] memory metadata = ["Quality: Premium", "Batch: 2024001"];
   uint256 tokenId = supplyChain.registerProduct(
       manufacturerAddress,
       "iPhone 15",
       "Electronics",
       "IPHONE15-001",
       "Cupertino, CA",
       metadata
   );
   ```

2. **Transfer to Distributor**:
   ```solidity
   supplyChain.transferWithTax(
       manufacturer,
       distributor,
       tokenId,
       "wholesale"
   );
   ```

3. **Verify Product Authenticity** (Consumer):
   ```solidity
   bool isAuthentic = supplyChain.verifyProductMetadata(tokenId, metadata);
   ```

4. **Track Ownership History**:
   ```solidity
   OwnershipRecord[] memory history = supplyChain.getOwnershipHistory(tokenId);
   address[] memory allOwners = supplyChain.getAllOwners(tokenId);
   ```

## Testing

The project includes comprehensive tests covering:

- Product registration and minting
- Ownership transfers with tax calculation
- Metadata verification
- Complete supply chain flow (manufacturer → distributor → retailer → consumer)
- Role-based access control
- Pause/unpause functionality
- Product destruction by customs
- Error handling and edge cases

Run tests with:
```bash
forge test -vv
```

For gas reports:
```bash
forge test --gas-report
```

## Security Features

- **Role-based access control** preventing unauthorized operations
- **Pausable functionality** for emergency stops
- **Metadata hash verification** to prevent product tampering
- **Ownership validation** before transfers
- **Comprehensive event logging** for audit trails

## Future Enhancements

- QR code integration for consumer verification
- Advanced tax calculation based on product categories
- Integration with IoT devices for real-time tracking
- Multi-signature approvals for high-value products
- Integration with existing ERP systems

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Project Structure

```
supply-chain-system/
├── src/
│   └── SupplyChainERC1155.sol    # Main contract
├── test/
│   └── SupplyChainERC1155.t.sol  # Comprehensive tests
├── script/
│   └── DeploySupplyChain.s.sol   # Deployment scripts
├── lib/                          # Dependencies
├── foundry.toml                  # Foundry configuration
└── README.md                     # This file
```

## Contact

For questions, issues, or contributions, please open an issue on the GitHub repository.

---

**Note**: This project was developed as part of a university blockchain supply chain management system, implementing advanced features like ERC1155 tokens, Keccak256 metadata hashing, and comprehensive ownership tracking as specified in the original project requirements.
