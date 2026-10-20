const API_BASE_URL = 'http://localhost:5000'

/**
 * StegoShare Backend API Client
 */
export const api = {
  /**
   * Process Confidential File (Encrypt + Stego Embed + IPFS Pin + Blockchain Register)
   */
  async processFile(formData) {
    const response = await fetch(`${API_BASE_URL}/api/process`, {
      method: 'POST',
      body: formData
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Failed to process file')
    }
    return data
  },

  /**
   * Get File Public Metadata
   */
  async getFileInfo(fileId) {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`)
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch file metadata')
    }
    return data
  },

  /**
   * Verify Wallet Authorization for a File
   */
  async verifyAccess(fileId, walletAddress) {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/verify-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify access')
    }
    return data
  },

  /**
   * Authorize, Extract, Decrypt, and Verify SHA-256 File Integrity
   */
  async recoverFile(fileId, walletAddress) {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    })
    const data = await response.json()
    // Return structured payload even on 422 if integrityStatus is present
    if (!response.ok && !data.integrityStatus) {
      throw new Error(data.message || 'Failed to recover and decrypt file')
    }
    return data
  },

  /**
   * Standalone check for SHA-256 File Integrity Verification
   */
  async verifyIntegrity(fileId) {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/verify-integrity`)
    const data = await response.json()
    return data
  },

  /**
   * Get Download URL for Recovered Decrypted File
   */
  getRecoveredDownloadUrl(fileId, walletAddress) {
    return `${API_BASE_URL}/api/files/${fileId}/download-recovered?wallet=${encodeURIComponent(walletAddress)}`
  },

  /**
   * Get Download URL for Stego Image
   */
  getStegoDownloadUrl(fileId) {
    return `${API_BASE_URL}/api/files/${fileId}/download-stego`
  },

  /**
   * Get IPFS Gateway URL
   */
  getIpfsGatewayUrl(cid) {
    return `${API_BASE_URL}/ipfs/${cid}`
  },

  /**
   * Revoke Access (Owner only)
   */
  async revokeAccess(fileId, ownerAddress) {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerAddress })
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Failed to revoke access')
    }
    return data
  },

  /**
   * Restore Access (Owner only)
   */
  async restoreAccess(fileId, ownerAddress) {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerAddress })
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Failed to restore access')
    }
    return data
  },

  /**
   * Get Security Dashboard Metrics
   */
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/api/stats`)
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch stats')
    }
    return data.stats
  }
}
