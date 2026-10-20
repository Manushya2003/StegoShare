const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("====================================================");
  console.log("🚀 Deploying StegoShareAccess Smart Contract...");
  console.log("====================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "ETH");

  const StegoShareAccess = await hre.ethers.getContractFactory("StegoShareAccess");
  const contract = await StegoShareAccess.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ StegoShareAccess deployed successfully to:", contractAddress);

  // Export contract deployment info for frontend and backend
  const deploymentInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  const outputDir = path.join(__dirname, "..", "deployed");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "contract-address.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📄 Contract deployment saved to deployed/contract-address.json");
  console.log("====================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
