// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StegoShareAccess
 * @dev Decentralized access control smart contract for StegoShare.
 * Enforces role-based permissions and verification for encrypted & stego-hidden files.
 */
contract StegoShareAccess {
    struct FileRecord {
        string fileId;
        address owner;
        address authorizedReceiver;
        string ipfsCid;
        string fileHash;
        uint256 timestamp;
        bool isRevoked;
        bool exists;
    }

    // Mapping from unique file ID to file record
    mapping(string => FileRecord) private files;

    // Mapping from owner address to list of registered file IDs
    mapping(address => string[]) private ownerFiles;

    // Mapping from receiver address to list of shared file IDs
    mapping(address => string[]) private receiverFiles;

    // Events
    event FileRegistered(
        string indexed fileId,
        address indexed owner,
        address indexed authorizedReceiver,
        string ipfsCid,
        string fileHash,
        uint256 timestamp
    );

    event AccessRevoked(
        string indexed fileId,
        address indexed owner,
        uint256 timestamp
    );

    event AccessRestored(
        string indexed fileId,
        address indexed owner,
        uint256 timestamp
    );

    event OwnershipTransferred(
        string indexed fileId,
        address indexed oldOwner,
        address indexed newOwner
    );

    // Modifiers
    modifier fileMustExist(string memory fileId) {
        require(files[fileId].exists, "StegoShare: File record does not exist");
        _;
    }

    modifier onlyFileOwner(string memory fileId) {
        require(files[fileId].exists, "StegoShare: File record does not exist");
        require(files[fileId].owner == msg.sender, "StegoShare: Caller is not the file owner");
        _;
    }

    /**
     * @notice Register a newly secured file with access permissions on blockchain
     * @param fileId Unique identifier for the file
     * @param authorizedReceiver Address authorized to decrypt the file
     * @param ipfsCid IPFS Content Identifier where stego image is pinned
     * @param fileHash SHA-256 integrity hash of original confidential file
     */
    function registerFile(
        string memory fileId,
        address authorizedReceiver,
        string memory ipfsCid,
        string memory fileHash
    ) external {
        require(bytes(fileId).length > 0, "StegoShare: File ID cannot be empty");
        require(authorizedReceiver != address(0), "StegoShare: Invalid receiver address");
        require(!files[fileId].exists, "StegoShare: File ID already registered");
        require(bytes(ipfsCid).length > 0, "StegoShare: IPFS CID cannot be empty");
        require(bytes(fileHash).length > 0, "StegoShare: File hash cannot be empty");

        files[fileId] = FileRecord({
            fileId: fileId,
            owner: msg.sender,
            authorizedReceiver: authorizedReceiver,
            ipfsCid: ipfsCid,
            fileHash: fileHash,
            timestamp: block.timestamp,
            isRevoked: false,
            exists: true
        });

        ownerFiles[msg.sender].push(fileId);
        receiverFiles[authorizedReceiver].push(fileId);

        emit FileRegistered(
            fileId,
            msg.sender,
            authorizedReceiver,
            ipfsCid,
            fileHash,
            block.timestamp
        );
    }

    /**
     * @notice Verify whether a user is authorized to access the file
     * @param fileId Unique identifier of the file
     * @param user Address of the user to verify
     * @return isAuthorized True if user is owner or active authorized receiver
     * @return role "OWNER", "RECEIVER", "REVOKED", or "UNAUTHORIZED"
     */
    function verifyAccess(string memory fileId, address user)
        external
        view
        fileMustExist(fileId)
        returns (bool isAuthorized, string memory role)
    {
        FileRecord memory f = files[fileId];

        if (user == f.owner) {
            return (true, "OWNER");
        }

        if (f.isRevoked) {
            return (false, "REVOKED");
        }

        if (user == f.authorizedReceiver) {
            return (true, "RECEIVER");
        }

        return (false, "UNAUTHORIZED");
    }

    /**
     * @notice Get file metadata
     * @param fileId Unique identifier of the file
     */
    function getFileMetadata(string memory fileId)
        external
        view
        fileMustExist(fileId)
        returns (
            address owner,
            address authorizedReceiver,
            string memory ipfsCid,
            string memory fileHash,
            uint256 timestamp,
            bool isRevoked
        )
    {
        FileRecord memory f = files[fileId];
        return (
            f.owner,
            f.authorizedReceiver,
            f.ipfsCid,
            f.fileHash,
            f.timestamp,
            f.isRevoked
        );
    }

    /**
     * @notice Revoke access permissions for the authorized receiver
     * @param fileId Unique identifier of the file
     */
    function revokeAccess(string memory fileId) external onlyFileOwner(fileId) {
        require(!files[fileId].isRevoked, "StegoShare: Access already revoked");
        files[fileId].isRevoked = true;
        emit AccessRevoked(fileId, msg.sender, block.timestamp);
    }

    /**
     * @notice Restore access permissions for the authorized receiver
     * @param fileId Unique identifier of the file
     */
    function restoreAccess(string memory fileId) external onlyFileOwner(fileId) {
        require(files[fileId].isRevoked, "StegoShare: Access is not revoked");
        files[fileId].isRevoked = false;
        emit AccessRestored(fileId, msg.sender, block.timestamp);
    }

    /**
     * @notice Transfer ownership of the file to another address
     * @param fileId Unique identifier of the file
     * @param newOwner Address of new owner
     */
    function transferOwnership(string memory fileId, address newOwner)
        external
        onlyFileOwner(fileId)
    {
        require(newOwner != address(0), "StegoShare: Invalid new owner address");
        address oldOwner = files[fileId].owner;
        files[fileId].owner = newOwner;
        emit OwnershipTransferred(fileId, oldOwner, newOwner);
    }

    /**
     * @notice Get all file IDs created by owner
     */
    function getFilesByOwner(address owner) external view returns (string[] memory) {
        return ownerFiles[owner];
    }

    /**
     * @notice Get all file IDs shared with receiver
     */
    function getFilesByReceiver(address receiver) external view returns (string[] memory) {
        return receiverFiles[receiver];
    }
}
