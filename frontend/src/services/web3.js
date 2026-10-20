import { ethers } from 'ethers'

export const DEMO_WALLETS = {
  OWNER: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    name: 'Hardhat Account #0 (File Owner)',
    role: 'Owner',
    toString() { return this.address }
  },
  RECEIVER: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    name: 'Hardhat Account #1 (Authorized Receiver)',
    role: 'Authorized Receiver',
    toString() { return this.address }
  },
  ATTACKER: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    name: 'Hardhat Account #2 (Unauthorized Attacker)',
    role: 'Unauthorized Third Party',
    toString() { return this.address }
  }
}

export const CONTRACT_ABI = [
  "function registerFile(string memory fileId, address authorizedReceiver, string memory ipfsCid, string memory fileHash) external",
  "function verifyAccess(string memory fileId, address user) external view returns (bool isAuthorized, string memory role)",
  "function getFileMetadata(string memory fileId) external view returns (address owner, address authorizedReceiver, string memory ipfsCid, string memory fileHash, uint256 timestamp, bool isRevoked)",
  "function revokeAccess(string memory fileId) external",
  "function restoreAccess(string memory fileId) external",
  "event FileRegistered(string indexed fileId, address indexed owner, address indexed authorizedReceiver, string ipfsCid, string fileHash, uint256 timestamp)",
  "event AccessRevoked(string indexed fileId, address indexed owner, uint256 timestamp)"
]

export class Web3Service {
  static isMetaMaskInstalled() {
    return typeof window !== 'undefined' && Boolean(window.ethereum)
  }

  static async connectMetaMask() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is required to verify secure access. Please install or open MetaMask and try again.')
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in MetaMask.')
      }

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()

      return {
        address,
        chainId: Number(network.chainId),
        networkName: network.name || 'Ethereum Network',
        isMetaMask: true
      }
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('MetaMask connection request was rejected by user.')
      }
      throw new Error(error.message || 'Failed to connect MetaMask wallet.')
    }
  }

  static shortenAddress(address, chars = 4) {
    if (!address) return ''
    const str = typeof address === 'string' ? address.trim() : (address?.address || String(address)).trim()
    if (str.length <= chars * 2 + 2) return str
    return `${str.substring(0, chars + 2)}...${str.substring(str.length - chars)}`
  }

  static extractAddress(input) {
    if (!input) return ''
    if (typeof input === 'string') return input.trim()
    if (typeof input === 'object' && input.address) return String(input.address).trim()
    return String(input).trim()
  }

  static isValidAddress(address) {
    if (!address) return false
    const str = typeof address === 'string' ? address.trim() : (address?.address || String(address)).trim()
    if (str.includes('...')) return false
    return ethers.isAddress(str)
  }

  static normalizeAddress(address) {
    if (!address) return ''
    const str = typeof address === 'string' ? address.trim() : (address?.address || String(address)).trim()
    if (str.includes('...')) return ''
    try {
      return ethers.getAddress(str)
    } catch {
      return str.toLowerCase()
    }
  }

  static isAddressEqual(addr1, addr2) {
    if (!addr1 || !addr2) return false
    const n1 = this.normalizeAddress(addr1)
    const n2 = this.normalizeAddress(addr2)
    return Boolean(n1 && n2 && n1.toLowerCase() === n2.toLowerCase())
  }
}


