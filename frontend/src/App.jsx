import React, { useState, useEffect } from "react";
import { BrowserProvider, JsonRpcProvider, Contract, keccak256, toUtf8Bytes } from "ethers";
import { ABI, CONTRACT_ADDRESS } from "./LandRegistryABI.js";

const STATUS_NAMES = ["None", "Registered", "Verified", "TransferPending", "Transferred", "Disputed"];
const DEFAULT_RPC = "http://127.0.0.1:8545";
const ADDR_KEY = "landreg_contract_addr";

function isBytes32Id(input) {
  return /^0x[0-9a-fA-F]{64}$/.test(input.trim());
}

function toPropertyId(input) {
  const s = input.trim();
  return isBytes32Id(s) ? s.toLowerCase() : keccak256(toUtf8Bytes(s));
}

export default function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [contractAddress, setContractAddress] = useState(
    () => localStorage.getItem(ADDR_KEY) || CONTRACT_ADDRESS
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistrar, setIsRegistrar] = useState(false);
  const [isNotary, setIsNotary] = useState(false);
  const [mode, setMode] = useState("authority");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  const [searchId, setSearchId] = useState("");
  const [found, setFound] = useState(null);
  const [history, setHistory] = useState([]);

  const [reg, setReg] = useState({
    propertyId: "PROP-1001",
    propertyNumber: "PLOT-1001",
    location: "Connaught Place, New Delhi",
    area: "1450",
    propertyType: "Residential",
    initialOwner: "",
    documentHash: "0x" + "a".repeat(64),
  });

  const [transfer, setTransfer] = useState({ id: "", to: "" });

  function statusMsg(t = "") {
    setStatus(t);
    console.log("[status]", t);
  }

  // Make sure MetaMask is pointed at the local Hardhat network (chainId 31337).
  // Auto-switches, or adds the network the first time.
  async function ensureLocalNetwork() {
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId === "0x7a69") return { ok: true };
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x7a69" }],
        });
      } catch (e) {
        if (e.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0x7a69",
                chainName: "Hardhat Local",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              }],
            });
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x7a69" }],
            });
          } catch (e2) {
            return { ok: false, msg: "MetaMask could not add the network. Add it manually: network http://127.0.0.1:8545, chainId 31337." };
          }
        } else {
          return { ok: false, msg: "Switch MetaMask to the Hardhat local network (http://127.0.0.1:8545, chainId 31337) and click Connect Wallet again." };
        }
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: "MetaMask network error: " + e.message };
    }
  }

  async function connect() {
    setReadOnly(false);
    // Wallets (MetaMask, etc.) only inject into http/https pages, never file://.
    // This check must come FIRST: dead code. If the built page was opened
    // straight off disk, tell the user to serve it over HTTP instead.
    if (window.location.protocol === "file:") {
      setAccount("");
      setContract(null);
      statusMsg("This page was opened as a local file (file://), so MetaMask cannot inject here. Serve the app over HTTP instead: run `npm run demo` (opens http://localhost:3000), or in frontend/ run `npm run dev` and open http://localhost:3000.");
      return;
    }
    if (!window.ethereum) {
      setAccount("");
      setContract(null);
      statusMsg("MetaMask not detected in this browser. Install the MetaMask extension (https://metamask.io/download/), reload the page, then click Connect Wallet again. If you opened the built dist/index.html as a local file, serve it over HTTP instead (npm run dev / npm run demo) so MetaMask injects.");
      return;
    }
    try {
      const net = await ensureLocalNetwork();
      if (!net.ok) {
        setAccount("");
        setContract(null);
        statusMsg(net.msg);
        return;
      }
      if (!window.ethereum) {
        statusMsg("MetaMask was installed/updated — reload the page, then click Connect Wallet again.");
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const c = new Contract(contractAddress, ABI, signer);
      // Validate the address actually hosts a LandRegistry contract.
      const admin = await c.admin();
      setAccount(addr);
      setContract(c);
      setIsAdmin(addr.toLowerCase() === admin.toLowerCase());
      try { setIsRegistrar(await c.isRegistrar(addr)); } catch (e) {}
      try { setIsNotary(await c.isNotary(addr)); } catch (e) {}
      statusMsg(`Connected: ${addr}`);
    } catch (err) {
      setAccount("");
      setContract(null);
      statusMsg("Failed to connect: " + err.message + ". Make sure: (1) the Hardhat node is running and seeded (npm run demo), (2) MetaMask is on http://127.0.0.1:8545 / chainId 31337, (3) the contract address (editable below) matches the deployed one, and (4) you approved the wallet request.");
    }
  }

  async function connectReadOnly() {
    try {
      const provider = new JsonRpcProvider(DEFAULT_RPC);
      await provider.getNetwork();
      const c = new Contract(contractAddress, ABI, provider);
      await c.admin();
      setContract(c);
      setReadOnly(true);
      setIsAdmin(false);
      setIsRegistrar(false);
      setIsNotary(false);
      statusMsg("Connected to local node (read-only). Connect MetaMask to submit transactions.");
    } catch (err) {
      statusMsg("Local node not found at " + DEFAULT_RPC + ". Start it in the project root with: npm run node (then npm run seed).");
    }
  }

  function saveAddress() {
    localStorage.setItem(ADDR_KEY, contractAddress.trim());
    statusMsg("Contract address saved. Reconnecting…");
    if (window.ethereum) {
      connect();
    } else {
      connectReadOnly();
    }
  }

  function needContract() {
    if (contract) return true;
    statusMsg("Not connected. Use 'Local Node (read-only)' or connect MetaMask first.");
    return false;
  }

  async function lookup(pid) {
    try {
      const p = await contract.getProperty(pid);
      setFound({
        ...p,
        pid,
        statusName: STATUS_NAMES[p.status],
        registeredAt: new Date(Number(p.registeredAt) * 1000).toLocaleString(),
        lastTransferredAt: p.lastTransferredAt === 0n
          ? "Never"
          : new Date(Number(p.lastTransferredAt) * 1000).toLocaleString(),
      });
      const h = await contract.getOwnershipHistory(pid);
      setHistory(h.map(r => ({
        from: r.from, to: r.to,
        at: new Date(Number(r.timestamp) * 1000).toLocaleString(),
      })));
      statusMsg("Property found!");
    } catch (err) {
      setFound(null);
      setHistory([]);
      statusMsg("Property not found: " + err.message);
    }
  }

  async function search() {
    if (!needContract()) return;
    await lookup(toPropertyId(searchId));
  }

  async function viewProperty(id) {
    const pid = isBytes32Id(id) ? id.toLowerCase() : toPropertyId(id);
    setSearchId(id);
    setMode("buyer");
    if (contract) await lookup(pid);
  }

  async function register() {
    if (!contract) return statusMsg("Connect a wallet (Registrar role) first.");
    try {
      const pid = toPropertyId(reg.propertyId);
      const tx = await contract.registerProperty(
        pid, reg.propertyNumber, reg.location, reg.area,
        reg.propertyType, reg.initialOwner, reg.documentHash
      );
      setTxHash(tx.hash);
      statusMsg("Registration transaction sent: " + tx.hash);
      await tx.wait();
      statusMsg("Property registered successfully!");
      setSearchId(reg.propertyId);
    } catch (err) {
      statusMsg("Register failed: " + err.message);
    }
  }

  async function verify() {
    if (!contract) return statusMsg("Connect a wallet (Notary role) first.");
    try {
      const pid = toPropertyId(searchId);
      const tx = await contract.verifyProperty(pid);
      setTxHash(tx.hash);
      statusMsg("Verify transaction sent: " + tx.hash);
      await tx.wait();
      statusMsg("Property verified!");
      await search();
    } catch (err) {
      statusMsg("Verify failed: " + err.message);
    }
  }

  async function doTransfer() {
    if (!contract) return statusMsg("Connect a wallet (current owner) first.");
    try {
      const pid = toPropertyId(transfer.id);
      const tx = await contract.transferOwnership(pid, transfer.to);
      setTxHash(tx.hash);
      statusMsg("Transfer transaction sent: " + tx.hash);
      await tx.wait();
      statusMsg("Ownership transferred successfully!");
      setSearchId(transfer.id);
      await search();
    } catch (err) {
      statusMsg("Transfer failed: " + err.message);
    }
  }

  useEffect(() => {
    connectReadOnly();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => setAccount(""));
    }
  }, []);

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", maxWidth: 1100, margin: "0 auto", padding: "24px", color: "#1e293b" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>🏛 Blockchain Land Registry</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Tamper-evident property registration, verification & ownership transfer
          </p>
        </div>
        <div>
          {account ? (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{account.slice(0, 8)}…{account.slice(-6)}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {isAdmin && "👑 Admin "}
                {isRegistrar && "📝 Registrar "}
                {isNotary && "⚖️ Notary"}
                {!isAdmin && !isRegistrar && !isNotary && "👤 Citizen"}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={connect} style={btnStyle}>🔗 Connect Wallet</button>
              <button onClick={connectReadOnly} style={{ ...btnStyle, background: "#334155" }}>🔌 Local Node (read-only)</button>
            </div>
          )}
        </div>
      </div>

      {readOnly && (
        <div style={{ background: "#fefce8", border: "1px solid #fde047", borderRadius: 8, padding: "10px 14px", marginTop: 16, fontSize: 13 }}>
          Read-only mode: data comes from the local Hardhat node. Something to try — search <b>PROP-1001</b> below, then connect MetaMask to register/verify/transfer.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        {[
          ["authority", "Authority Dashboard"],
          ["owner", "Owner Dashboard"],
          ["buyer", "Buyer / Verify"],
        ].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            style={{ ...btnStyle, ...(mode === m ? {} : { background: "#e2e8f0", color: "#1e293b" }) }}>
            {label}
          </button>
        ))}
      </div>

      {status && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", marginTop: 16, fontSize: 14 }}>
          {status}
        </div>
      )}
      {txHash && <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>TX: {txHash}</div>}

      {mode === "authority" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Register Property</h3>
            {!isRegistrar && <p style={{ color: "#dc2626", fontSize: 13 }}>⚠️ Requires Registrar role (connect admin/registrar account)</p>}
            {[
              ["propertyId", "Property ID (e.g. PROP-1001)"],
              ["propertyNumber", "Property Number"],
              ["location", "Location"],
              ["area", "Area (sq ft)"],
              ["propertyType", "Property Type (Residential/Commercial/Land)"],
              ["initialOwner", "Initial Owner Wallet Address"],
              ["documentHash", "Document Hash (SHA-256)"],
            ].map(([k, label]) => (
              <label key={k} style={{ display: "block", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                <input
                  value={reg[k]}
                  onChange={e => setReg({ ...reg, [k]: e.target.value })}
                  style={inputStyle}
                />
              </label>
            ))}
            <button onClick={register} disabled={!isRegistrar} style={btnStyle}>📝 Register Property</button>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Verify Property</h3>
            {!isNotary && <p style={{ color: "#dc2626", fontSize: 13 }}>⚠️ Requires Notary role (connect admin/notary account)</p>}
            <label style={{ display: "block", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Property ID</span>
              <input value={searchId} onChange={e => setSearchId(e.target.value)} style={inputStyle} placeholder="e.g. PROP-1001 (or paste a 0x… hash)" />
            </label>
            <button onClick={search} style={{ ...btnStyle, background: "#334155" }}>🔍 Lookup</button>{" "}
            <button onClick={verify} disabled={!isNotary} style={btnStyle}>✅ Verify Property</button>

            {found && <PropertyDetails p={found} history={history} />}
          </div>
        </div>
      )}

      {mode === "owner" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Transfer Ownership</h3>
            <label style={{ display: "block", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Property ID</span>
              <input value={transfer.id} onChange={e => setTransfer({ ...transfer, id: e.target.value })} style={inputStyle} placeholder="e.g. PROP-1001" />
            </label>
            <label style={{ display: "block", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>New Owner Wallet Address</span>
              <input value={transfer.to} onChange={e => setTransfer({ ...transfer, to: e.target.value })} style={inputStyle} placeholder="0x..." />
            </label>
            <button onClick={doTransfer} style={btnStyle}>🔄 Transfer Ownership</button>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
              Only the current owner may transfer. Property must be verified first.
            </p>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>My Properties</h3>
            <MyProperties contract={contract} account={account} onView={viewProperty} />
          </div>
        </div>
      )}

      {mode === "buyer" && (
        <div style={{ marginTop: 20 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Verify Property & Ownership</h3>
            <label style={{ display: "block", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Property ID</span>
              <input value={searchId} onChange={e => setSearchId(e.target.value)} style={inputStyle} placeholder="e.g. PROP-1001 (or paste a 0x… hash)" />
            </label>
            <button onClick={search} style={btnStyle}>🔍 Verify Property</button>
            {found && <PropertyDetails p={found} history={history} />}
          </div>
        </div>
      )}

      <div style={{ marginTop: 28, borderTop: "1px solid #e2e8f0", paddingTop: 12, fontSize: 13, color: "#475569" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>Contract address:</span>
          <input
            value={contractAddress}
            onChange={e => setContractAddress(e.target.value)}
            style={{ ...inputStyle, width: 380, fontFamily: "monospace" }}
          />
          <button onClick={saveAddress} style={{ ...btnStyle, background: "#334155", padding: "8px 14px" }}>Save & Reconnect</button>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0 0" }}>
          Local node: {DEFAULT_RPC}. The default address is the first contract Hardhat deploys on a fresh local node.
          If you restart a node or deploy other contracts first, save the new address above.
        </p>
      </div>

      <footer style={{ marginTop: 20, borderTop: "1px solid #e2e8f0", paddingTop: 12, fontSize: 12, color: "#94a3b8" }}>
        Educational prototype — does not create legally valid ownership. Blockchain records are tamper-evident but legal
        title requires government integration. Connect MetaMask to a local Hardhat node (or Remix VM) to try the flows.
      </footer>
    </div>
  );
}

function MyProperties({ contract, account, onView }) {
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!contract || !account) return;
    setLoading(true);
    try {
      const props = await contract.getPropertiesByOwner(account);
      setIds(props);
    } catch (e) {
      console.error(e);
      setIds([]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [contract, account]);

  return (
    <div>
      {!account && <p style={{ fontSize: 13, color: "#64748b" }}>Connect a MetaMask wallet to see its properties.</p>}
      <button onClick={load} style={{ ...btnStyle, background: "#334155", marginBottom: 12 }}>⟳ Refresh</button>
      {loading && <p style={{ fontSize: 13, color: "#64748b" }}>Loading…</p>}
      {ids.length === 0 && !loading && <p style={{ fontSize: 13, color: "#64748b" }}>No properties found for this wallet.</p>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {ids.map(id => (
          <li key={id} style={rowStyle}>
            <span style={{ fontFamily: "monospace", fontSize: 13 }}>{id.slice(0, 18)}…</span>
            <button
              onClick={() => onView(id)}
              style={{ ...btnStyle, fontSize: 12, padding: "6px 10px" }}
            >
              View
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PropertyDetails({ p, history }) {
  return (
    <div style={{ marginTop: 16, background: "#f8fafc", borderRadius: 8, padding: 14, fontSize: 13 }}>
      <h4 style={{ margin: "0 0 10px", fontSize: 15 }}>Property Details</h4>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <Row k="Property ID" v={p.pid?.slice(0, 24) + "…"} mono />
          <Row k="Property Number" v={p.propertyNumber} />
          <Row k="Location" v={p.location} />
          <Row k="Area" v={String(p.area) + " sq ft"} />
          <Row k="Type" v={p.propertyType} />
          <Row k="Current Owner" v={p.currentOwner} mono />
          <Row k="Previous Owner" v={p.previousOwner === "0x0000000000000000000000000000000000000000" ? "—" : p.previousOwner} mono />
          <Row k="Status" v={p.statusName} />
          <Row k="Verified" v={String(p.verified)} />
          <Row k="Document Hash" v={p.documentHash.slice(0, 30) + "…"} mono />
          <Row k="Registered At" v={p.registeredAt} />
          <Row k="Last Transferred" v={p.lastTransferredAt} />
        </tbody>
      </table>

      {history.length > 0 && (
        <div style={{ marginTop: 14, borderTop: "1px dashed #cbd5e1", paddingTop: 10 }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>🕘 Ownership History</h4>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
            {history.map((r, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                <b style={{ color: "#1d4ed8" }}>{r.from.slice(0, 8)}…</b> → <b style={{ color: "#059669" }}>{r.to.slice(0, 8)}…</b>
                <span style={{ color: "#94a3b8" }}> — {r.at}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Row({ k, v, mono }) {
  return (
    <tr>
      <td style={{ padding: "6px 8px", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0", width: "42%" }}>{k}</td>
      <td style={{ padding: "6px 8px", borderBottom: "1px solid #e2e8f0", fontFamily: mono ? "monospace" : "inherit" }}>{v}</td>
    </tr>
  );
}

const btnStyle = {
  background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8,
  padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
};

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1",
  fontSize: 14, marginTop: 4, boxSizing: "border-box",
};

const cardStyle = {
  border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, background: "#fff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const rowStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 8,
};