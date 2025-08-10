// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SupplyChainERC1155.sol";

contract DeploySupplyChain is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying SupplyChainERC1155 contract...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the supply chain contract
        SupplyChainERC1155 supplyChain = new SupplyChainERC1155();

        vm.stopBroadcast();

        console.log("SupplyChainERC1155 deployed at:", address(supplyChain));
        
        // Log initial roles
        console.log("Default admin role granted to:", deployer);
        console.log("Contract deployment completed successfully!");
        
        // Example of setting up initial roles (commented out for safety)
        /*
        vm.startBroadcast(deployerPrivateKey);
        
        // Grant roles to specific addresses (replace with actual addresses)
        // supplyChain.grantManufacturerRole(0x1234...); // Replace with actual manufacturer address
        // supplyChain.grantDistributorRole(0x5678...);  // Replace with actual distributor address
        // supplyChain.grantRetailerRole(0x9ABC...);     // Replace with actual retailer address
        // supplyChain.grantCustomsRole(0xDEF0...);      // Replace with actual customs address
        
        vm.stopBroadcast();
        */
    }
}

contract SetupRoles is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        
        // Example addresses - replace with actual addresses
        address manufacturer1 = vm.envAddress("MANUFACTURER1_ADDRESS");
        address manufacturer2 = vm.envAddress("MANUFACTURER2_ADDRESS");
        address distributor = vm.envAddress("DISTRIBUTOR_ADDRESS");
        address retailer = vm.envAddress("RETAILER_ADDRESS");
        address customs = vm.envAddress("CUSTOMS_ADDRESS");

        console.log("Setting up roles for SupplyChainERC1155 contract...");
        console.log("Contract address:", contractAddress);

        vm.startBroadcast(deployerPrivateKey);

        SupplyChainERC1155 supplyChain = SupplyChainERC1155(contractAddress);

        // Grant manufacturer roles
        supplyChain.grantManufacturerRole(manufacturer1);
        supplyChain.grantManufacturerRole(manufacturer2);
        console.log("Manufacturer role granted to:", manufacturer1);
        console.log("Manufacturer role granted to:", manufacturer2);

        // Grant distributor role
        supplyChain.grantDistributorRole(distributor);
        console.log("Distributor role granted to:", distributor);

        // Grant retailer role
        supplyChain.grantRetailerRole(retailer);
        console.log("Retailer role granted to:", retailer);

        // Grant customs role
        supplyChain.grantCustomsRole(customs);
        console.log("Customs role granted to:", customs);

        vm.stopBroadcast();

        console.log("Role setup completed successfully!");
    }
} 