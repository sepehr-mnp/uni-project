// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SupplyChainERC1155.sol";

contract SupplyChainERC1155Test is Test {
    SupplyChainERC1155 public supplyChain;
    
    address public admin = address(1);
    address public manufacturer1 = address(2);
    address public manufacturer2 = address(3);
    address public distributor = address(4);
    address public retailer = address(5);
    address public consumer = address(6);
    address public customs = address(7);

    event ProductRegistered(
        uint256 indexed tokenId,
        address indexed manufacturer,
        bytes32 metadataHash,
        string metadataUrl
    );
    
    event OwnershipTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        string reason
    );

    function setUp() public {
        vm.prank(admin);
        supplyChain = new SupplyChainERC1155();
        
        // Grant roles
        vm.startPrank(admin);
        supplyChain.grantManufacturerRole(manufacturer1);
        supplyChain.grantManufacturerRole(manufacturer2);
        supplyChain.grantDistributorRole(distributor);
        supplyChain.grantRetailerRole(retailer);
        supplyChain.grantCustomsRole(customs);
        vm.stopPrank();
    }

    function testDeployment() public {
        assertTrue(supplyChain.hasRole(supplyChain.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(supplyChain.hasRole(supplyChain.CUSTOMS_ROLE(), admin));
        assertTrue(supplyChain.hasRole(supplyChain.MANUFACTURER_ROLE(), manufacturer1));
        assertTrue(supplyChain.hasRole(supplyChain.DISTRIBUTOR_ROLE(), distributor));
    }

    function testRegisterProduct() public {
        vm.prank(manufacturer1);
        
        string memory metadataUrl = "https://ipfs.io/ipfs/QmTestHash123";
        bytes32 metadataHash = keccak256(abi.encodePacked('{"name":"iPhone 15","category":"Electronics"}'));
        
        uint256 tokenId = supplyChain.registerProduct(
            manufacturer1,
            "iPhone 15",
            "Electronics",
            "IPHONE15-001",
            "Cupertino, CA",
            metadataUrl,
            metadataHash,
            1  // amount
        );

        // Verify token ID is incremental (should be 1 for first product)
        assertEq(tokenId, 1, "First token ID should be 1");

        // Verify product was created
        (uint256 id, string memory name, string memory category, string memory serialNumber, 
         uint256 productionDate, string memory geographicalOrigin, bytes32 storedMetadataHash, 
         string memory storedMetadataUrl, address manufacturer, bool exists) = supplyChain.products(tokenId);
        
        assertEq(name, "iPhone 15");
        assertEq(category, "Electronics");
        assertEq(serialNumber, "IPHONE15-001");
        assertEq(geographicalOrigin, "Cupertino, CA");
        assertEq(manufacturer, manufacturer1);
        assertEq(storedMetadataUrl, metadataUrl);
        assertEq(storedMetadataHash, metadataHash);
        assertTrue(exists);

        // Verify ownership
        assertEq(supplyChain.balanceOf(manufacturer1, tokenId), 1);
        
        // Verify ownership history using public mapping
        (address owner, uint256 timestamp, string memory transferReason) = supplyChain.ownershipHistory(tokenId, 0);
        assertEq(owner, manufacturer1);
        assertEq(transferReason, "manufactured");
    }

    function testRegisterProductOnlyManufacturer() public {
        vm.prank(distributor); // Not a manufacturer
        
        string memory metadataUrl = "https://ipfs.io/ipfs/QmTestHash456";
        bytes32 metadataHash = keccak256(abi.encodePacked('{"name":"Test Product"}'));
        
        vm.expectRevert();
        supplyChain.registerProduct(
            distributor,
            "Test Product",
            "Test Category",
            "TEST-001",
            "Test Location",
            metadataUrl,
            metadataHash,
            1  // amount
        );
    }

    function testMultipleProductRegistration() public {
        vm.startPrank(manufacturer1);
        
        // Register multiple products (no uniqueness constraints now)
        uint256 tokenId1 = supplyChain.registerProduct(
            manufacturer1,
            "Product A",
            "Category",
            "SERIAL-001",
            "Location",
            "https://ipfs.io/ipfs/QmProduct1",
            keccak256(abi.encodePacked('{"name":"Product A","batch":"001"}')),
            1  // amount
        );

        uint256 tokenId2 = supplyChain.registerProduct(
            manufacturer1,
            "Product B",
            "Category",
            "SERIAL-002",
            "Location",
            "https://ipfs.io/ipfs/QmProduct2",
            keccak256(abi.encodePacked('{"name":"Product B","batch":"002"}')),
            1  // amount
        );
        
        // Verify both products were created with incremental IDs
        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        
        vm.stopPrank();
    }

    function testDestroyProduct() public {
        // Register product
        vm.prank(manufacturer1);
        string memory metadataUrl = "https://ipfs.io/ipfs/QmDestroyTest";
        bytes32 metadataHash = keccak256(abi.encodePacked('{"name":"Test Product","batch":"001"}'));
        
        uint256 tokenId = supplyChain.registerProduct(
            manufacturer1,
            "Test Product",
            "Electronics",
            "TEST-001",
            "Test Location",
            metadataUrl,
            metadataHash,
            1  // amount
        );

        // Destroy product (only customs can do this)
        vm.prank(customs);
        supplyChain.destroyProduct(tokenId, "counterfeit detected");

        // Verify product is destroyed
        (,,,,,,,,, bool exists) = supplyChain.products(tokenId);
        assertFalse(exists);
        
        // Verify token is burned
        assertEq(supplyChain.balanceOf(manufacturer1, tokenId), 0);
        
        // Verify ownership history includes destruction (check index 1 since 0 is manufacture, 1 is destruction)
        (address owner, uint256 timestamp, string memory transferReason) = supplyChain.ownershipHistory(tokenId, 1);
        assertEq(owner, address(0));
        assertEq(transferReason, "counterfeit detected");
    }

    function testGetMetadataUrl() public {
        vm.prank(manufacturer1);
        string memory metadataUrl = "https://ipfs.io/ipfs/QmMetadataUrlTest";
        bytes32 metadataHash = keccak256(abi.encodePacked('{"name":"URL Test"}'));
        
        uint256 tokenId = supplyChain.registerProduct(
            manufacturer1,
            "URL Test Product",
            "Test",
            "URL-001",
            "Test Location",
            metadataUrl,
            metadataHash,
            1  // amount
        );

        // Test uri function
        string memory uriResult = supplyChain.uri(tokenId);
        assertEq(uriResult, metadataUrl);
        
        // Test accessing metadata through products mapping
        (,,,,,, bytes32 storedHash, string memory storedUrl,,) = supplyChain.products(tokenId);
        assertEq(storedUrl, metadataUrl);
        assertEq(storedHash, metadataHash);
    }

    function testUpdateMetadataUrl() public {
        // Register product first
        vm.prank(manufacturer1);
        string memory originalUrl = "https://ipfs.io/ipfs/QmOriginalUrl";
        bytes32 originalHash = keccak256(abi.encodePacked('{"name":"Original"}'));
        
        uint256 tokenId = supplyChain.registerProduct(
            manufacturer1,
            "Update Test",
            "Test",
            "UPDATE-001",
            "Test Location",
            originalUrl,
            originalHash,
            1  // amount
        );

        // Update metadata URL (only admin can do this)
        vm.prank(admin);
        string memory newUrl = "https://ipfs.io/ipfs/QmNewUrl";
        bytes32 newHash = keccak256(abi.encodePacked('{"name":"Updated"}'));
        
        supplyChain.updateMetadataUrl(tokenId, newUrl, newHash);

        // Verify update
        (,,,,,, bytes32 storedHash, string memory storedUrl,,) = supplyChain.products(tokenId);
        assertEq(storedUrl, newUrl);
        assertEq(storedHash, newHash);
        assertEq(supplyChain.uri(tokenId), newUrl);
    }

    function testBatchGetters() public {
        vm.startPrank(manufacturer1);

        // Register multiple products
        uint256 tokenId1 = supplyChain.registerProduct(
            manufacturer1,
            "Product 1",
            "Category A",
            "SERIAL-001",
            "Location A",
            "https://ipfs.io/ipfs/QmProduct1",
            keccak256("metadata1"),
            5  // amount
        );

        uint256 tokenId2 = supplyChain.registerProduct(
            manufacturer1,
            "Product 2",
            "Category B",
            "SERIAL-002",
            "Location B",
            "https://ipfs.io/ipfs/QmProduct2",
            keccak256("metadata2"),
            3  // amount
        );

        uint256 tokenId3 = supplyChain.registerProduct(
            manufacturer1,
            "Product 3",
            "Category C",
            "SERIAL-003",
            "Location C",
            "https://ipfs.io/ipfs/QmProduct3",
            keccak256("metadata3"),
            10  // amount
        );

        vm.stopPrank();

        // Test nextTokenId (total products = nextTokenId - 1)
        uint256 nextId = supplyChain.nextTokenId();
        assertEq(nextId - 1, 3, "Total products should be 3");

        // Test getProductsBatch
        (SupplyChainERC1155.Product[] memory batchProducts, bool[] memory validProducts) = 
            supplyChain.getProductsBatch(1, 3);
        
        assertEq(batchProducts.length, 3, "Batch should return 3 products");
        assertTrue(validProducts[0], "Product 1 should be valid");
        assertTrue(validProducts[1], "Product 2 should be valid");
        assertTrue(validProducts[2], "Product 3 should be valid");
        
        assertEq(batchProducts[0].name, "Product 1");
        assertEq(batchProducts[1].name, "Product 2");
        assertEq(batchProducts[2].name, "Product 3");

        // Test getOwnedProductsCount
        uint256 ownedCount = supplyChain.getOwnedProductsCount(manufacturer1);
        assertEq(ownedCount, 3, "Manufacturer should own 3 products");

        // Test getOwnedProductsCount
        uint256 countOnly = supplyChain.getOwnedProductsCount(manufacturer1);
        assertEq(countOnly, 3, "Should return count of 3 products");

        // Test getAllOwnedProducts
        (SupplyChainERC1155.Product[] memory allOwnedProducts, uint256[] memory allTokenIds) = 
            supplyChain.getAllOwnedProducts(manufacturer1);
        
        assertEq(allOwnedProducts.length, 3, "Manufacturer should own 3 products");
        assertEq(allTokenIds[0], 1);
        assertEq(allTokenIds[1], 2);
        assertEq(allTokenIds[2], 3);

        // Test getOwnedProductsBatch with new signature (startIndex, count)
        (SupplyChainERC1155.Product[] memory ownedBatchProducts, uint256[] memory ownedBatchTokenIds) = 
            supplyChain.getOwnedProductsBatch(manufacturer1, 0, 2);
        
        assertEq(ownedBatchProducts.length, 2, "Should return 2 products from batch");
        assertEq(ownedBatchTokenIds[0], 1);
        assertEq(ownedBatchTokenIds[1], 2);

        // Test getProductsBatch for latest products (admin approach)
        (SupplyChainERC1155.Product[] memory latestProducts, bool[] memory validLatest) = 
            supplyChain.getProductsBatch(2, 3); // Get latest 2 products (IDs 2 and 3)
        
        assertEq(latestProducts.length, 2, "Should return 2 latest products");
        assertTrue(validLatest[0], "Product 2 should be valid");
        assertTrue(validLatest[1], "Product 3 should be valid");
        assertEq(latestProducts[0].name, "Product 2");
        assertEq(latestProducts[1].name, "Product 3");
    }

    function testOwnershipMappingUpdates() public {
        vm.startPrank(manufacturer1);
        
        // Register a product
        uint256 tokenId = supplyChain.registerProduct(
            manufacturer1,
            "Test Product",
            "Electronics",
            "TEST-001",
            "Test Location",
            "https://ipfs.io/ipfs/QmTest",
            keccak256("test"),
            1
        );

        // Check initial ownership
        uint256 manufacturerCount = supplyChain.getOwnedProductsCount(manufacturer1);
        assertEq(manufacturerCount, 1, "Manufacturer should own 1 product");
        
        (SupplyChainERC1155.Product[] memory manufacturerProducts, uint256[] memory manufacturerTokenIds) = 
            supplyChain.getAllOwnedProducts(manufacturer1);
        assertEq(manufacturerProducts.length, 1, "Manufacturer should own 1 product");
        assertEq(manufacturerTokenIds[0], tokenId);

        // Consumer should own nothing initially
        uint256 consumerCount = supplyChain.getOwnedProductsCount(consumer);
        assertEq(consumerCount, 0, "Consumer should own 0 products initially");

        // Transfer to consumer
        supplyChain.safeTransferFrom(manufacturer1, consumer, tokenId, 1, "");
        
        vm.stopPrank();

        // Check ownership after transfer
        uint256 manufacturerCountAfter = supplyChain.getOwnedProductsCount(manufacturer1);
        assertEq(manufacturerCountAfter, 0, "Manufacturer should own 0 products after transfer");

        uint256 consumerCountAfter = supplyChain.getOwnedProductsCount(consumer);
        assertEq(consumerCountAfter, 1, "Consumer should own 1 product after transfer");
        
        (SupplyChainERC1155.Product[] memory consumerProducts, uint256[] memory consumerTokenIds) = 
            supplyChain.getAllOwnedProducts(consumer);
        assertEq(consumerProducts.length, 1, "Consumer should own 1 product after transfer");
        assertEq(consumerTokenIds[0], tokenId);

        // Verify balances
        assertEq(supplyChain.balanceOf(manufacturer1, tokenId), 0, "Manufacturer balance should be 0");
        assertEq(supplyChain.balanceOf(consumer, tokenId), 1, "Consumer balance should be 1");
    }

    function testOwnershipMappingWithMultipleProducts() public {
        vm.startPrank(manufacturer1);
        
        // Register multiple products
        uint256 tokenId1 = supplyChain.registerProduct(
            manufacturer1, "Product 1", "Category", "SERIAL-001", "Location",
            "https://ipfs.io/ipfs/QmProduct1", keccak256("metadata1"), 1
        );
        
        uint256 tokenId2 = supplyChain.registerProduct(
            manufacturer1, "Product 2", "Category", "SERIAL-002", "Location",
            "https://ipfs.io/ipfs/QmProduct2", keccak256("metadata2"), 1
        );
        
        uint256 tokenId3 = supplyChain.registerProduct(
            manufacturer1, "Product 3", "Category", "SERIAL-003", "Location",
            "https://ipfs.io/ipfs/QmProduct3", keccak256("metadata3"), 1
        );

        // Check initial ownership
        uint256 initialCount = supplyChain.getOwnedProductsCount(manufacturer1);
        assertEq(initialCount, 3, "Manufacturer should own 3 products");

        // Transfer middle product (test swap-and-pop logic)
        supplyChain.safeTransferFrom(manufacturer1, consumer, tokenId2, 1, "");
        
        vm.stopPrank();

        // Check ownership after transfer
        uint256 manufacturerCountAfter = supplyChain.getOwnedProductsCount(manufacturer1);
        assertEq(manufacturerCountAfter, 2, "Manufacturer should own 2 products after transfer");
        
        (SupplyChainERC1155.Product[] memory manufacturerProductsAfter, uint256[] memory manufacturerTokensAfter) = 
            supplyChain.getAllOwnedProducts(manufacturer1);
        assertEq(manufacturerProductsAfter.length, 2, "Manufacturer should own 2 products after transfer");
        
        // The array should still contain tokenId1 and tokenId3 (order might change due to swap-and-pop)
        bool hasToken1 = false;
        bool hasToken3 = false;
        for (uint256 i = 0; i < manufacturerTokensAfter.length; i++) {
            if (manufacturerTokensAfter[i] == tokenId1) hasToken1 = true;
            if (manufacturerTokensAfter[i] == tokenId3) hasToken3 = true;
        }
        assertTrue(hasToken1, "Should still have token 1");
        assertTrue(hasToken3, "Should still have token 3");

        uint256 consumerCountAfter = supplyChain.getOwnedProductsCount(consumer);
        assertEq(consumerCountAfter, 1, "Consumer should own 1 product after transfer");
        
        (SupplyChainERC1155.Product[] memory consumerProductsAfter, uint256[] memory consumerTokensAfter) = 
            supplyChain.getAllOwnedProducts(consumer);
        assertEq(consumerProductsAfter.length, 1, "Consumer should own 1 product after transfer");
        assertEq(consumerTokensAfter[0], tokenId2);
    }
}