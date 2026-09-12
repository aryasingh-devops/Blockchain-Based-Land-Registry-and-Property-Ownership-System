// Default contract address: the first contract deployed on a fresh Hardhat node.
// The dApp lets users change and persist this address if it differs.
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "propertyId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "propertyId", "type": "bytes32" },
      { "indexed": false, "internalType": "string", "name": "propertyNumber", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "location", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "area", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "propertyType", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "documentHash", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "PropertyRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "propertyId", "type": "bytes32" },
      { "indexed": false, "internalType": "uint8", "name": "newStatus", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "PropertyStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "propertyId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "verifier", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "PropertyVerified",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "allPropertyIds",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "_propertyId", "type": "bytes32" }],
    "name": "getAllPropertyIds",
    "outputs": [{ "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }],
    "name": "getPropertiesByOwner",
    "outputs": [{ "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "_propertyId", "type": "bytes32" }],
    "name": "getOwnershipHistory",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "from", "type": "address" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct LandRegistry.OwnershipRecord[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "_propertyId", "type": "bytes32" }],
    "name": "getProperty",
    "outputs": [
      {
        "components": [
          { "internalType": "bytes32", "name": "propertyId", "type": "bytes32" },
          { "internalType": "string", "name": "propertyNumber", "type": "string" },
          { "internalType": "string", "name": "location", "type": "string" },
          { "internalType": "uint256", "name": "area", "type": "uint256" },
          { "internalType": "string", "name": "propertyType", "type": "string" },
          { "internalType": "address", "name": "currentOwner", "type": "address" },
          { "internalType": "address", "name": "previousOwner", "type": "address" },
          { "internalType": "string", "name": "documentHash", "type": "string" },
          { "internalType": "bool", "name": "verified", "type": "bool" },
          { "internalType": "uint8", "name": "status", "type": "uint8" },
          { "internalType": "uint256", "name": "registeredAt", "type": "uint256" },
          { "internalType": "uint256", "name": "lastTransferredAt", "type": "uint256" }
        ],
        "internalType": "struct LandRegistry.Property",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "isNotary",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "isRegistrar",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "isSurveyor",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_propertyId", "type": "bytes32" },
      { "internalType": "string", "name": "_propertyNumber", "type": "string" },
      { "internalType": "string", "name": "_location", "type": "string" },
      { "internalType": "uint256", "name": "_area", "type": "uint256" },
      { "internalType": "string", "name": "_propertyType", "type": "string" },
      { "internalType": "address", "name": "_initialOwner", "type": "address" },
      { "internalType": "string", "name": "_documentHash", "type": "string" }
    ],
    "name": "registerProperty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_propertyId", "type": "bytes32" }
    ],
    "name": "verifyProperty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_propertyId", "type": "bytes32" },
      { "internalType": "address", "name": "_newOwner", "type": "address" }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_propertyId", "type": "bytes32" },
      { "internalType": "uint8", "name": "_newStatus", "type": "uint8" }
    ],
    "name": "updatePropertyStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "bool", "name": "status", "type": "bool" }
    ],
    "name": "setNotary",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "bool", "name": "status", "type": "bool" }
    ],
    "name": "setRegistrar",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "bool", "name": "status", "type": "bool" }
    ],
    "name": "setSurveyor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];