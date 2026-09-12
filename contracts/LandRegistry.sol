// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRegistry {

    // ─── Roles ───────────────────────────────────────────────
    address public admin;
    mapping(address => bool) public isRegistrar;
    mapping(address => bool) public isSurveyor;
    mapping(address => bool) public isNotary;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    modifier onlyRegistrar() {
        require(isRegistrar[msg.sender], "Only registrar");
        _;
    }
    modifier onlyNotary() {
        require(isNotary[msg.sender], "Only notary");
        _;
    }

    // ─── Enums ───────────────────────────────────────────────
    enum PropertyStatus { None, Registered, Verified, TransferPending, Transferred, Disputed }

    // ─── Structs ─────────────────────────────────────────────
    struct Property {
        bytes32 propertyId;
        string  propertyNumber;
        string  location;
        uint256 area;
        string  propertyType;
        address currentOwner;
        address previousOwner;
        string  documentHash;
        bool    verified;
        PropertyStatus status;
        uint256 registeredAt;
        uint256 lastTransferredAt;
    }

    struct OwnershipRecord {
        address from;
        address to;
        uint256 timestamp;
    }

    // ─── Storage ─────────────────────────────────────────────
    mapping(bytes32 => Property) public properties;
    mapping(bytes32 => bool)     public propertyExists;
    mapping(bytes32 => OwnershipRecord[]) public ownershipHistory;
    bytes32[] public allPropertyIds;

    // ─── Events ──────────────────────────────────────────────
    event PropertyRegistered(
        bytes32 indexed propertyId, string propertyNumber,
        string location, address indexed owner, uint256 area,
        string propertyType, string documentHash, uint256 timestamp
    );
    event PropertyVerified(
        bytes32 indexed propertyId, address indexed verifier, uint256 timestamp
    );
    event OwnershipTransferred(
        bytes32 indexed propertyId, address indexed from,
        address indexed to, uint256 timestamp
    );
    event PropertyStatusUpdated(
        bytes32 indexed propertyId, PropertyStatus newStatus, uint256 timestamp
    );

    // ─── Constructor ─────────────────────────────────────────
    constructor() {
        admin = msg.sender;
        isRegistrar[msg.sender] = true;
        isSurveyor[msg.sender]  = true;
        isNotary[msg.sender]    = true;
    }

    // ─── Role Management ─────────────────────────────────────
    function setRegistrar(address account, bool status) external onlyAdmin {
        isRegistrar[account] = status;
    }

    function setSurveyor(address account, bool status) external onlyAdmin {
        isSurveyor[account] = status;
    }

    function setNotary(address account, bool status) external onlyAdmin {
        isNotary[account] = status;
    }

    // ─── Register Property ───────────────────────────────────
    function registerProperty(
        bytes32 _propertyId,
        string  calldata _propertyNumber,
        string  calldata _location,
        uint256 _area,
        string  calldata _propertyType,
        address _initialOwner,
        string  calldata _documentHash
    ) external onlyRegistrar {
        require(!propertyExists[_propertyId], "Property already exists");
        require(_initialOwner != address(0), "Owner cannot be zero address");
        require(_area > 0, "Area must be greater than zero");
        require(bytes(_documentHash).length > 0, "Document hash required");

        properties[_propertyId] = Property({
            propertyId:        _propertyId,
            propertyNumber:    _propertyNumber,
            location:          _location,
            area:              _area,
            propertyType:      _propertyType,
            currentOwner:      _initialOwner,
            previousOwner:     address(0),
            documentHash:      _documentHash,
            verified:          false,
            status:            PropertyStatus.Registered,
            registeredAt:      block.timestamp,
            lastTransferredAt: 0
        });

        propertyExists[_propertyId] = true;
        allPropertyIds.push(_propertyId);

        emit PropertyRegistered(
            _propertyId, _propertyNumber, _location,
            _initialOwner, _area, _propertyType,
            _documentHash, block.timestamp
        );
    }

    // ─── Verify Property ─────────────────────────────────────
    function verifyProperty(bytes32 _propertyId) external onlyNotary {
        require(propertyExists[_propertyId], "Property does not exist");
        require(!properties[_propertyId].verified, "Already verified");

        properties[_propertyId].verified = true;
        properties[_propertyId].status   = PropertyStatus.Verified;

        emit PropertyVerified(_propertyId, msg.sender, block.timestamp);
        emit PropertyStatusUpdated(_propertyId, PropertyStatus.Verified, block.timestamp);
    }

    // ─── Transfer Ownership ──────────────────────────────────
    function transferOwnership(
        bytes32 _propertyId,
        address _newOwner
    ) external {
        require(propertyExists[_propertyId], "Property does not exist");
        require(_newOwner != address(0), "New owner cannot be zero address");
        require(
            properties[_propertyId].currentOwner == msg.sender,
            "Only current owner can transfer"
        );
        require(properties[_propertyId].verified, "Property must be verified first");
        require(
            properties[_propertyId].status != PropertyStatus.Disputed,
            "Disputed property cannot be transferred"
        );

        address oldOwner = properties[_propertyId].currentOwner;

        properties[_propertyId].previousOwner     = oldOwner;
        properties[_propertyId].currentOwner       = _newOwner;
        properties[_propertyId].lastTransferredAt  = block.timestamp;
        properties[_propertyId].status             = PropertyStatus.Transferred;

        ownershipHistory[_propertyId].push(
            OwnershipRecord(oldOwner, _newOwner, block.timestamp)
        );

        emit OwnershipTransferred(_propertyId, oldOwner, _newOwner, block.timestamp);
        emit PropertyStatusUpdated(_propertyId, PropertyStatus.Transferred, block.timestamp);
    }

    // ─── Update Status ───────────────────────────────────────
    function updatePropertyStatus(
        bytes32 _propertyId,
        PropertyStatus _newStatus
    ) external onlyAdmin {
        require(propertyExists[_propertyId], "Property does not exist");
        properties[_propertyId].status = _newStatus;
        emit PropertyStatusUpdated(_propertyId, _newStatus, block.timestamp);
    }

    // ─── View Functions ──────────────────────────────────────
    function getProperty(bytes32 _propertyId) external view returns (Property memory) {
        require(propertyExists[_propertyId], "Property does not exist");
        return properties[_propertyId];
    }

    function getOwnershipHistory(bytes32 _propertyId)
        external view returns (OwnershipRecord[] memory)
    {
        require(propertyExists[_propertyId], "Property does not exist");
        return ownershipHistory[_propertyId];
    }

    function getAllPropertyIds() external view returns (bytes32[] memory) {
        return allPropertyIds;
    }

    function getPropertiesByOwner(address _owner)
        external view returns (bytes32[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < allPropertyIds.length; i++) {
            if (properties[allPropertyIds[i]].currentOwner == _owner) count++;
        }
        bytes32[] memory result = new bytes32[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allPropertyIds.length; i++) {
            if (properties[allPropertyIds[i]].currentOwner == _owner) {
                result[idx++] = allPropertyIds[i];
            }
        }
        return result;
    }
}
