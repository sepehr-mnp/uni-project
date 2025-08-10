// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title SupplyChainERC1155
 * @dev ERC1155 based supply chain system with metadata hash verification and owner tracing
 * @author Based on university project requirements
 */
contract SupplyChainERC1155 is ERC1155, AccessControl, Pausable, ERC1155Supply {
    // Roles for different participants in the supply chain
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant CUSTOMS_ROLE = keccak256("CUSTOMS_ROLE");

    // Product structure
    struct Product {
        uint256 id;
        string name;
        string category;
        string serialNumber;
        uint256 productionDate;
        string geographicalOrigin;
        bytes32 metadataHash; // Keccak256 hash of metadata content (calculated off-chain)
        string metadataUrl; // IPFS URL for full metadata
        address manufacturer;
        bool exists;
    }

    // Owner history for tracing
    struct OwnershipRecord {
        address owner;
        uint256 timestamp;
        string transferReason; // "manufactured", "sold", "distributed", etc.
    }

    // Mappings
    mapping(uint256 => Product) public products;
    mapping(uint256 => OwnershipRecord[]) public ownershipHistory;
    
    // Metadata URL registry: tokenId => metadata URL
    mapping(uint256 => string) public metadataRegistry;
    // Reverse lookup: metadata URL => tokenId (for verification)
    mapping(string => uint256) public urlToTokenId;
    
    // Mapping from address to array of owned product IDs
    mapping(address => uint256[]) public ownedProducts;
    // Mapping from address to mapping of tokenId to index in ownedProducts array (for efficient removal)
    mapping(address => mapping(uint256 => uint256)) public ownedProductIndex;
    
    // Incremental token ID counter
    uint256 public nextTokenId = 1;
    
    // Events
    event ProductRegistered(
        uint256 indexed tokenId,
        address indexed manufacturer,
        bytes32 metadataHash,
        string metadataUrl
    );
    
    event MetadataUrlUpdated(
        uint256 indexed tokenId,
        string oldUrl,
        string newUrl
    );
    
    event OwnershipTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        string reason
    );

    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CUSTOMS_ROLE, msg.sender);
    }

    /**
     * @dev Register a new product (mint)
     * @param to Address to mint the product to
     * @param name Product name
     * @param category Product category
     * @param serialNumber Unique serial number
     * @param geographicalOrigin Origin location
     * @param metadataUrl IPFS URL for full metadata (calculated off-chain)
     * @param metadataHash Keccak256 hash of metadata content (calculated off-chain)
     */
    function registerProduct(
        address to,
        string memory name,
        string memory category,
        string memory serialNumber,
        string memory geographicalOrigin,
        string memory metadataUrl,
        bytes32 metadataHash,
        uint256 amount
    ) external onlyRole(MANUFACTURER_ROLE) whenNotPaused returns (uint256) {

        // Use incremental token ID
        uint256 tokenId = nextTokenId;
        nextTokenId++;

        // Store metadata URL registry
        metadataRegistry[tokenId] = metadataUrl;
        urlToTokenId[metadataUrl] = tokenId;

        // Create product
        products[tokenId] = Product({
            id: tokenId,
            name: name,
            category: category,
            serialNumber: serialNumber,
            productionDate: block.timestamp,
            geographicalOrigin: geographicalOrigin,
            metadataHash: metadataHash,
            metadataUrl: metadataUrl,
            manufacturer: msg.sender,
            exists: true
        });

        _mint(to, tokenId, amount, "");

        // Record initial ownership
        ownershipHistory[tokenId].push(OwnershipRecord({
            owner: to,
            timestamp: block.timestamp,
            transferReason: "manufactured"
        }));

        emit ProductRegistered(tokenId, msg.sender, metadataHash, metadataUrl);
        
        return tokenId;
    }

    /**
     * @dev Update product metadata URL (only by admin - for emergency cases like IPFS provider failure)
     * @param tokenId Product token ID
     * @param newMetadataUrl New metadata URL
     * @param newMetadataHash New metadata hash (if content changed)
     */
    function updateMetadataUrl(
        uint256 tokenId,
        string memory newMetadataUrl,
        bytes32 newMetadataHash
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {

        string memory oldUrl = metadataRegistry[tokenId];
        
        // Update mappings
        delete urlToTokenId[oldUrl];
        
        metadataRegistry[tokenId] = newMetadataUrl;
        urlToTokenId[newMetadataUrl] = tokenId;
        // Update product struct
        products[tokenId].metadataUrl = newMetadataUrl;
        products[tokenId].metadataHash = newMetadataHash;

        emit MetadataUrlUpdated(tokenId, oldUrl, newMetadataUrl);
    }
 
    /**
     * @dev Burn/destroy a product (only by customs or admin)
     * @param tokenId Product token ID
     * @param reason Reason for destruction
     */
    function destroyProduct(
        uint256 tokenId,
        string memory reason
    ) external onlyRole(CUSTOMS_ROLE) {
        // Get current owner from ownership history
        OwnershipRecord[] memory history = ownershipHistory[tokenId];
        address currentOwner = history[history.length - 1].owner;
        
        _burn(currentOwner, tokenId, 1);
        
        // Record destruction in ownership history
        ownershipHistory[tokenId].push(OwnershipRecord({
            owner: address(0),
            timestamp: block.timestamp,
            transferReason: reason
        }));
        
        products[tokenId].exists = false;
    }

    // Role management functions
    function grantManufacturerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MANUFACTURER_ROLE, account);
    }

    function grantDistributorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DISTRIBUTOR_ROLE, account);
    }

    function grantRetailerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(RETAILER_ROLE, account);
    }

    function grantCustomsRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(CUSTOMS_ROLE, account);
    }

    // Pausable functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Override functions required by Solidity
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal override(ERC1155, ERC1155Supply) {
        // Check if paused before any transfer
        if (from != address(0) || to != address(0)) {
            _requireNotPaused();
        }
        
        // Update owned products mapping before calling super._update
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 tokenId = ids[i];
            uint256 amount = amounts[i];
            
            // Skip if no amount is being transferred
            if (amount == 0) continue;
            
            // Handle removal from 'from' address (except for minting)
            if (from != address(0)) {
                uint256 fromBalance = balanceOf(from, tokenId);
                // If this transfer will result in zero balance, remove from owned products
                if (fromBalance == amount) {
                    _removeFromOwnedProducts(from, tokenId);
                }
            }
            
            // Handle addition to 'to' address (except for burning)
            if (to != address(0)) {
                uint256 toBalance = balanceOf(to, tokenId);
                // If 'to' address didn't own this token before, add it to owned products
                if (toBalance == 0) {
                    _addToOwnedProducts(to, tokenId);
                }
            }
        }
        
        super._update(from, to, ids, amounts);
        
        // Record ownership transfer in history for single token transfers
        if (ids.length == 1 && from != address(0) && to != address(0)) {
            ownershipHistory[ids[0]].push(OwnershipRecord({
                owner: to,
                timestamp: block.timestamp,
                transferReason: "transferred"
            }));
            
            emit OwnershipTransferred(ids[0], from, to, "transferred");
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns the URI for a given token ID
     * @param tokenId Token ID to get URI for
     * @return URI string for the token
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(products[tokenId].exists, "Token does not exist");
        return metadataRegistry[tokenId];
    }

    /**
     * @dev Add a token to the owned products array for an address
     * @param owner Address to add the token to
     * @param tokenId Token ID to add
     */
    function _addToOwnedProducts(address owner, uint256 tokenId) internal {
        uint256[] storage owned = ownedProducts[owner];
        ownedProductIndex[owner][tokenId] = owned.length;
        owned.push(tokenId);
    }

    /**
     * @dev Remove a token from the owned products array for an address
     * Uses swap-and-pop to avoid empty slots
     * @param owner Address to remove the token from
     * @param tokenId Token ID to remove
     */
    function _removeFromOwnedProducts(address owner, uint256 tokenId) internal {
        uint256[] storage owned = ownedProducts[owner];
        uint256 tokenIndex = ownedProductIndex[owner][tokenId];
        
        // To prevent a gap in the array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).
        uint256 lastTokenIndex = owned.length - 1;
        
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = owned[lastTokenIndex];
            
            // Move the last token to the slot of the token to delete
            owned[tokenIndex] = lastTokenId;
            // Update the moved token's index
            ownedProductIndex[owner][lastTokenId] = tokenIndex;
        }
        
        // Remove the last element
        owned.pop();
        delete ownedProductIndex[owner][tokenId];
    }



    /**
     * @dev Get products in batch by range (inclusive)
     * @param startId Starting token ID (inclusive)
     * @param endId Ending token ID (inclusive)
     * @return batchProducts Array of products in the range
     * @return validProducts Array indicating which products exist
     */
    function getProductsBatch(uint256 startId, uint256 endId) 
        external 
        view 
        returns (Product[] memory batchProducts, bool[] memory validProducts) 
    {        
        uint256 length = endId - startId + 1;
        batchProducts = new Product[](length);
        validProducts = new bool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = startId + i;
            if (tokenId < nextTokenId && products[tokenId].exists) {
                batchProducts[i] = products[tokenId];
                validProducts[i] = true;
            } else {
                validProducts[i] = false;
            }
        }
    }

    /**
     * @dev Get the number of products owned by an address
     * @param owner Address to check
     * @return count Number of products owned
     */
    function getOwnedProductsCount(address owner) external view returns (uint256) {
        return ownedProducts[owner].length;
    }

    /**
     * @dev Get products owned by a specific address in batch using the owned products mapping
     * @param owner Address of the owner
     * @param startIndex Starting index in the owned products array
     * @param count Number of products to return
     * @return ownedProductsData Array of products owned by the address
     * @return tokenIds Array of corresponding token IDs
     */
    function getOwnedProductsBatch(address owner, uint256 startIndex, uint256 count)
        external
        view
        returns (Product[] memory ownedProductsData, uint256[] memory tokenIds)
    {   
        uint256[] memory ownedTokenIds = ownedProducts[owner];
        uint256 totalOwned = ownedTokenIds.length;
        
        if (startIndex >= totalOwned || count == 0) {
            return (new Product[](0), new uint256[](0));
        }
        
        // Calculate actual count to return
        uint256 endIndex = startIndex + count;
        if (endIndex > totalOwned) {
            endIndex = totalOwned;
        }
        uint256 actualCount = endIndex - startIndex;
        
        ownedProductsData = new Product[](actualCount);
        tokenIds = new uint256[](actualCount);
        
        for (uint256 i = 0; i < actualCount; i++) {
            uint256 tokenId = ownedTokenIds[startIndex + i];
            tokenIds[i] = tokenId;
            ownedProductsData[i] = products[tokenId];
        }
    }

    /**
     * @dev Get all products owned by an address (use with caution for addresses with many products)
     * @param owner Address of the owner
     * @return ownedProductsData Array of all products owned by the address
     * @return tokenIds Array of corresponding token IDs
     */
    function getAllOwnedProducts(address owner)
        external
        view
        returns (Product[] memory ownedProductsData, uint256[] memory tokenIds)
    {   
        uint256[] memory ownedTokenIds = ownedProducts[owner];
        uint256 totalOwned = ownedTokenIds.length;
        
        ownedProductsData = new Product[](totalOwned);
        tokenIds = new uint256[](totalOwned);
        
        for (uint256 i = 0; i < totalOwned; i++) {
            uint256 tokenId = ownedTokenIds[i];
            tokenIds[i] = tokenId;
            ownedProductsData[i] = products[tokenId];
        }
    }
}