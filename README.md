# 🔐 StegoShare

> **Secure File Sharing Using Blockchain, AES-256 Encryption, Image Steganography, IPFS, and Blockchain-Based Access Control**

StegoShare is a complete, production-grade decentralized cybersecurity platform engineered for zero-trust confidential file sharing. It bridges AES-256 symmetric cryptography, 24-bit RGB Least Significant Bit (LSB) image steganography, decentralized IPFS storage, and Solidity smart contracts for immutable wallet-based access permissions.

---

## 🏛️ System Architecture Workflow

```
Confidential File
      ↓
File Upload & Validation
      ↓
AES-256-CBC Encryption (Unique 32-byte Key & 16-byte IV)
      ↓
SHA-256 Integrity Hash Generated
      ↓
Encrypted Payload Packaged with Binary Metadata Header
      ↓
LSB Steganography: Hidden inside Carrier Image RGB Channels
      ↓
Stego Image Uploaded to Decentralized IPFS Storage
      ↓
IPFS Content Identifier (CID) Generated
      ↓
File Metadata & Access Permissions Recorded on Blockchain Smart Contract
      ↓
Authorized Receiver Receives Secure Share Link (/access/:fileId)
      ↓
Receiver Connects MetaMask Ethereum Wallet
      ↓
Smart Contract / Ledger Verifies Wallet Address
      ↓
[If Authorized]:
  ├── 1. Retrieve Stego Image from IPFS
  ├── 2. Extract Hidden Binary Encrypted Payload
  ├── 3. Verify SHA-256 Integrity Hash (Tamper Detection)
  ├── 4. Decrypt with AES-256 Cryptographic Key
  └── 5. Download Original Confidential File
[If Unauthorized / Revoked]:
  └── ⛔ ACCESS DENIED (File Recovery is Blocked)
```

---

## 🚀 Key Features

- 🔒 **AES-256 Military-Grade Encryption**: Protects file contents using 256-bit keys and random initialization vectors (IVs).
- 🖼️ **Lossless LSB Steganography**: Embeds encrypted ciphertext directly into PNG pixel RGB channels with pre-flight capacity verification.
- 🌐 **Decentralized IPFS Storage**: Live Pinata IPFS pinning with automatic local IPFS gateway fallback for zero-friction local testing.
- ⛓️ **Solidity Access Control Smart Contracts**: Enforces role-based permissions (`registerFile`, `verifyAccess`, `revokeAccess`).
- 🦊 **MetaMask Web3 Authentication**: Zero-trust identity verification using Ethereum wallet signatures and addresses.
- 🛡️ **Cryptographic Tamper Detection**: SHA-256 hash comparison ensures files have not been modified or corrupted during transit.
- 💎 **Cybersecurity SaaS UI**: Dark theme, glowing glassmorphic panels, monospace cryptographic artifacts, and real-time interactive recovery workflows.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, JavaScript, Lucide Icons, Modern CSS Design System |
| **Backend** | Node.js, Express, Multer, Sharp (Image processing), Crypto module |
| **Blockchain** | Solidity `^0.8.20`, Hardhat, Ethers.js v6 |
| **Storage** | IPFS (InterPlanetary File System), Pinata SDK, Local IPFS Gateway |

---

## 📂 Project Structure

```
Stegoshare/
├── backend/
│   ├── controllers/
│   │   └── fileController.js        # File processing, access verification, recovery
│   ├── services/
│   │   ├── cryptoService.js         # AES-256 encryption, decryption, SHA-256 hashing
│   │   ├── stegoService.js          # LSB bitwise embedding and extraction
│   │   ├── ipfsService.js           # Pinata & local IPFS decentralized storage
│   │   └── blockchainService.js     # Access ledger & smart contract integration
│   ├── routes/
│   │   └── fileRoutes.js            # REST API endpoints
│   ├── data/
│   │   └── records.json             # On-chain verified file access records
│   ├── uploads/                     # Temporary staging for uploads
│   ├── encrypted/                   # Encrypted ciphertext storage
│   ├── stego/                       # Generated stego PNG images
│   ├── ipfs/                        # IPFS pinned asset storage
│   ├── recovered/                   # Decrypted plaintext output
│   ├── server.js                    # Express server entrypoint
│   └── package.json
├── blockchain/
│   ├── contracts/
│   │   └── StegoShareAccess.sol     # Solidity access control smart contract
│   ├── scripts/
│   │   └── deploy.js                # Hardhat deployment script
│   ├── hardhat.config.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Brand, navigation, MetaMask & test wallet switcher
│   │   │   ├── Hero.jsx             # Hero section with live security metrics
│   │   │   ├── ProtocolSection.jsx  # 5-step animated protocol pipeline
│   │   │   ├── SecurityFeatures.jsx # 6 cybersecurity capability cards
│   │   │   ├── Footer.jsx           # Footer links
│   │   │   └── Modals.jsx           # Privacy, Terms, Audit & Compliance modals
│   │   ├── pages/
│   │   │   ├── SharePage.jsx        # 4-step upload, steganography & live progress
│   │   │   ├── SecuredStatusPage.jsx# Artifacts, IPFS CID, TxHash, Copy buttons
│   │   │   └── AccessPage.jsx       # Secure Access Portal & 5-step file recovery
│   │   ├── services/
│   │   │   ├── api.js               # Backend REST API client
│   │   │   └── web3.js              # MetaMask provider & test account simulation
│   │   ├── App.jsx                  # Main application router
│   │   ├── App.css                  # Cybersecurity SaaS component styles
│   │   └── index.css                # Global design system tokens & grid theme
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js `v18+` or `v20+` (Installed: Node `v22.23.2`)
- npm `v9+`

### 1. Start the Backend Server
```bash
cd backend
npm install
node server.js
```
*Backend runs on `http://localhost:5000` with local IPFS gateway at `http://localhost:5000/ipfs/`.*

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Step-by-Step Demonstration & Testing

### Test 1: Share & Secure a Confidential File
1. Open the frontend at `http://localhost:5173`.
2. Click **"Share a File"** in the navigation bar.
3. **Step 1:** Select any confidential document (e.g. `secret.txt`, `contract.pdf`).
4. **Step 2:** Select a carrier image (PNG format). The capacity meter shows available bytes.
5. **Step 3:** Enter the authorized receiver's Ethereum address (Click **"Test Receiver Account #1"** to auto-fill `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`).
6. Click **"Secure & Process File"**.
7. Watch the real-time 8-stage cryptographic execution log.
8. Upon completion, the **Asset Secured** page will display:
   - **IPFS CID** (with 1-click Copy)
   - **Blockchain Transaction Hash** (with 1-click Copy)
   - **File ID** (with 1-click Copy)
   - **SHA-256 Hash** (with 1-click Copy)
   - **Secure Share Link** (`http://localhost:5173/access/stego-...`)

---

### Test 2: Access & File Recovery (Authorized Receiver)
1. Click **"Test Access in Portal"** or navigate to `http://localhost:5173/access/{fileId}`.
2. In the top right wallet dropdown or central card, connect with **Account #1 (Authorized Receiver)** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`.
3. The portal displays **"ACCESS AUTHORIZED"**.
4. Run the **5-Step Interactive Recovery**:
   - **Step 1:** Retrieve Stego Image from IPFS.
   - **Step 2:** Extract Encrypted Payload via LSB steganography.
   - **Step 3:** Verify SHA-256 Hash Integrity (Tamper check passes).
   - **Step 4:** Decrypt File with AES-256 key.
   - **Step 5:** Click **"Download Original File"** to download the exact recovered plaintext file!

---

### Test 3: Zero-Trust Denial (Unauthorized Attacker)
1. On the same Access Portal, switch wallet to **Account #2 (Unauthorized User)** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`.
2. The portal immediately switches to **"ACCESS DENIED"**.
3. All extraction and decryption actions are strictly locked. No plaintext data is exposed.

---

### Test 4: Owner Access Revocation
1. Connect with **Account #0 (File Owner)** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`.
2. Scroll to the **Owner Access Control** section and click **"Revoke Receiver Access"**.
3. Now switch back to **Account #1 (Receiver)**. Notice that access is immediately **REVOKED** and recovery is disabled!
4. Switch back to Owner and click **"Restore Receiver Access"** to re-enable permissions.

---

## 🔒 Security Guarantees
- **Confidentiality:** Files are encrypted with AES-256 before steganographic embedding.
- **Stealth:** Carrier images appear completely normal to human perception.
- **Integrity:** SHA-256 hashes are verified on-chain before recovery.
- **Non-Repudiation:** Access grants and revocations are logged as immutable blockchain events.

---

## 📄 License
MIT © 2026 StegoShare Project. All rights reserved.
