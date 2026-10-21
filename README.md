#  StegoShare

**Secure File Sharing Using AES-256 Encryption, Image Steganography, IPFS, and Blockchain-Based Access Control**

StegoShare is a final-year project designed to improve the confidentiality and controlled sharing of digital files. It combines file encryption, image steganography, decentralized storage, and blockchain-based wallet authorization in a secure file-sharing workflow.

##  Project Overview

Sharing confidential files online can create risks involving unauthorized access, data exposure, and file tampering. StegoShare explores a multi-layered approach to secure file sharing by encrypting a file, embedding the encrypted data into an image, storing the resulting image using IPFS, and managing access permissions through a smart contract.

##  Key Features

- **AES-256 Encryption:** Encrypts file contents before embedding them into an image.
- **Image Steganography:** Uses Least Significant Bit (LSB) techniques to hide encrypted data within a carrier image.
- **IPFS Storage:** Supports decentralized storage and retrieval of shared assets.
- **Blockchain Access Control:** Uses a smart contract to manage authorized access to shared files.
- **MetaMask Integration:** Connects Ethereum-compatible wallets for access authorization.
- **SHA-256 Integrity Checking:** Supports hash-based integrity verification when implemented and enabled in the file recovery workflow.
- **Access Revocation:** Allows the file owner to revoke a receiver's permission, subject to the deployed contract and application implementation.

##  System Workflow

```text
Confidential File
       |
       v
File Validation
       |
       v
AES-256 Encryption
       |
       v
SHA-256 Integrity Hash
       |
       v
LSB Image Steganography
       |
       v
Upload Stego Image to IPFS
       |
       v
Obtain IPFS CID
       |
       v
Register File and Access Permissions
       |
       v
Receiver Connects Wallet
       |
       v
Verify Access Permission
       |
       +---- Authorized
       |         |
       |         v
       |    Retrieve Stego Image
       |         |
       |         v
       |    Extract Encrypted Data
       |         |
       |         v
       |    Verify Integrity
       |         |
       |         v
       |    Decrypt and Recover File
       |
       +---- Unauthorized
                 |
                 v
             Access Denied
```

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Image Processing | Sharp |
| Cryptography | AES-256, SHA-256, Node.js Crypto |
| Blockchain | Solidity, Hardhat, Ethers.js |
| Wallet | MetaMask |
| Storage | IPFS, Pinata |

##  Project Structure

```text
Stegoshare/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── package.json
├── blockchain/
│   ├── contracts/
│   ├── scripts/
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
```

*The structure above is a simplified overview. Folder and file names may vary depending on the current implementation.*

##  Prerequisites

Install the following before running the application:

- Node.js and npm
- Git
- MetaMask browser extension
- A local Hardhat blockchain for local smart-contract testing
- IPFS/Pinata configuration if required by your current backend setup

##  Getting Started

Clone the repository:

```bash
git clone https://github.com/Manushya2003/StegoShare.git
cd StegoShare
```

Install dependencies and start the backend in a terminal:

```bash
cd backend
npm install
node server.js
```

Start the frontend in a **separate terminal**:

```bash
cd frontend
npm install
npm run dev
```

Start and configure the local blockchain in another terminal if required by your application. Deploy the smart contract and configure the contract address and RPC URL according to your local setup.

Open the frontend URL displayed by Vite in the terminal. It is commonly `http://localhost:5173`.

**Configuration note:** Follow the environment variable names in the project's `.env.example` files. Never commit real API tokens, passwords, private keys, or wallet recovery phrases.

##  Testing the Application

Use test files and local development accounts when demonstrating the project.

1. **File sharing:** Select a file and a suitable carrier image.
2. **Encryption and embedding:** Run the file-processing workflow.
3. **IPFS storage:** Check the returned CID and confirm the asset can be retrieved.
4. **Authorized access:** Connect the wallet assigned permission to the file.
5. **File recovery:** Extract the embedded payload, verify integrity if enabled, and decrypt the file.
6. **Unauthorized access:** Connect a wallet without permission and confirm access is denied.
7. **Access revocation:** If supported by the deployed smart contract, revoke receiver access and test again.

Expected results should be confirmed against the running application before being presented as verified test outcomes.

##  Security Considerations

- Encrypt files before embedding them into carrier images.
- Keep encryption keys separate from public storage and source code.
- Treat IPFS CIDs as content identifiers, not as access-control mechanisms.
- Verify that authorization is enforced by the backend and/or smart contract, not just by hiding frontend buttons.
- Use cryptographically secure key and IV generation and authenticate encrypted data where supported.
- SHA-256 can help detect changes when the expected hash is trusted, but it does not by itself provide confidentiality or prove who created a file.
- Local Hardhat accounts are for development and testing only. Never publish real wallet secrets.

##  Project Objectives

- Improve file confidentiality through encryption.
- Hide encrypted file data within a carrier image using steganography.
- Explore decentralized storage with IPFS.
- Control file access using blockchain-based permissions.
- Support file integrity checking during recovery.

## 📄 License

A license has not yet been specified for this repository. Add a `LICENSE` file if you decide to distribute the project under an open-source license.