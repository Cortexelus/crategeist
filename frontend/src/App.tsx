import { useEffect, useState } from "react";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../declarations/collectors_backend";

interface Collector {
  collector_id: number;
  timestamp: bigint;
  name: string;
  wallet: string;
  text: string;
}

interface Purchase {
  purchase_id: number;
  timestamp: bigint;
  wallet: string;
  tx: string;
  link: string;
  text: string;
}

const agent = new HttpAgent({ host: window.location.origin.includes("://127") ? "http://127.0.0.1:4943" : undefined });
const backend = Actor.createActor(idlFactory as any, {
  agent,
  canisterId: (import.meta as any).env.VITE_BACKEND_CANISTER_ID || __BACKEND_ID__,
});

const etherscanAddr = (addr: string) => `https://etherscan.io/address/${addr}`;
const etherscanTx   = (tx: string)   => `https://etherscan.io/tx/${tx}`;
const truncate      = (s: string, n = 12) => (s.length > n ? `${s.slice(0, n)}…` : s);

export default function App() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [purchases,  setPurchases]  = useState<Purchase[]>([]);
  const [activeTab,  setActive]     = useState<"collectors" | "purchases">("collectors");

  useEffect(() => {
    (async () => {
      setCollectors(await backend.getCollectors());
      setPurchases(await backend.getPurchases());
    })();
  }, []);

  const Row = ({ children }: { children: React.ReactNode }) => (
    <tr className="border-b hover:bg-gray-50">{children}</tr>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 font-sans">
      <h1 className="text-3xl font-bold mb-6">ICP × Ethereum Collectors DB</h1>

      <div className="flex gap-4 mb-4">
        <button className={`px-4 py-2 rounded ${activeTab === "collectors" ? "bg-blue-600 text-white" : "bg-gray-200"}`} onClick={() => setActive("collectors")}>Collectors</button>
        <button className={`px-4 py-2 rounded ${activeTab === "purchases"  ? "bg-blue-600 text-white" : "bg-gray-200"}`} onClick={() => setActive("purchases")}>Purchases</button>
      </div>

      {activeTab === "collectors" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b uppercase text-gray-600">
              <th>ID</th><th>Time</th><th>Wallet</th><th>Name</th><th>Description</th>
            </tr>
          </thead>
          <tbody>
            {collectors.map(c => (
              <Row key={c.collector_id}>
                <td>{c.collector_id}</td>
                <td>{new Date(Number(c.timestamp) / 1_000_000n).toLocaleString()}</td>
                <td><a className="text-blue-600" href={etherscanAddr(c.wallet)} target="_blank" rel="noreferrer">{truncate(c.wallet, 10)}</a></td>
                <td>{c.name}</td>
                <td>
                  <details>
                    <summary className="cursor-pointer select-none text-gray-600">{truncate(c.text, 20)}</summary>
                    <p className="whitespace-pre-wrap mt-1">{c.text}</p>
                  </details>
                </td>
              </Row>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "purchases" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b uppercase text-gray-600">
              <th>ID</th><th>Time</th><th>Wallet</th><th>Tx</th><th>Link</th><th>Description</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <Row key={p.purchase_id}>
                <td>{p.purchase_id}</td>
                <td>{new Date(Number(p.timestamp) / 1_000_000n).toLocaleString()}</td>
                <td><a className="text-blue-600" href={etherscanAddr(p.wallet)} target="_blank" rel="noreferrer">{truncate(p.wallet, 10)}</a></td>
                <td><a className="text-blue-600" href={etherscanTx(p.tx)} target="_blank" rel="noreferrer">{truncate(p.tx)}</a></td>
                <td><a className="text-blue-600" href={p.link} target="_blank" rel="noreferrer">link</a></td>
                <td>
                  <details>
                    <summary className="cursor-pointer select-none text-gray-600">{truncate(p.text, 20)}</summary>
                    <p className="whitespace-pre-wrap mt-1">{p.text}</p>
                  </details>
                </td>
              </Row>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}