import React, { useEffect, useState } from "react";
import { hello_backend } from "declarations/hello_backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, RefreshCcw } from "lucide-react";

// ──────────────────────────────────────────────
//  TypeScript mirrors of Motoko records
//  These come from generated declarations but we re‑state for clarity
// ──────────────────────────────────────────────
export interface Collector {
  collector_id: bigint;
  timestamp: bigint; // nanoseconds epoch
  name: string;
  wallet: string;
  text: string;
}

export interface Purchase {
  purchase_id: bigint;
  timestamp: bigint;
  wallet: string;
  tx_id: string;
  link: string;
  text: string;
}

const nsToDate = (ns: bigint) => new Date(Number(ns / BigInt(1_000_000))); // ms precision

export default function App() {
  const [tab, setTab] = useState("collectors");
  const [loading, setLoading] = useState(false);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // form state
  const [newCollector, setNewCollector] = useState({ name: "", wallet: "", text: "" });
  const [editCollector, setEditCollector] = useState({ wallet: "", name: "", text: "" });
  const [newPurchase, setNewPurchase] = useState({ wallet: "", tx_id: "", link: "", text: "" });

  async function refresh() {
    setLoading(true);
    try {
      const colJson = await hello_backend.get_collectors_json();
      const purJson = await hello_backend.get_purchases_json();
      setCollectors(JSON.parse(colJson));
      setPurchases(JSON.parse(purJson));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // ──────────────────────────── Collectors actions ────────────────────────────
  const addCollector = async () => {
    const { name, wallet, text } = newCollector;
    if (!name || !wallet) return;
    await hello_backend.add_collector(name, wallet, text);
    setNewCollector({ name: "", wallet: "", text: "" });
    refresh();
  };

  const editCollectorSubmit = async () => {
    const { wallet, name, text } = editCollector;
    if (!wallet) return;
    await hello_backend.edit_collector(wallet, name ? [name] : [], text ? [text] : []);
    setEditCollector({ wallet: "", name: "", text: "" });
    refresh();
  };

  const deleteCollector = async (wallet: string) => {
    await hello_backend.delete_collector(wallet);
    refresh();
  };

  const deleteAllCollectors = async () => {
    await hello_backend.delete_all_collectors();
    refresh();
  };

  // ───────────────────────────── Purchases actions ────────────────────────────
  const addPurchase = async () => {
    const { wallet, tx_id, link, text } = newPurchase;
    if (!wallet || !tx_id) return;
    await hello_backend.add_purchase(wallet, tx_id, link, text);
    setNewPurchase({ wallet: "", tx_id: "", link: "", text: "" });
    refresh();
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ICP Demo Dashboard</CardTitle>
          <Button variant="secondary" size="icon" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <RefreshCcw className="h-5 w-5" />}
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="collectors">Collectors</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
            </TabsList>

            {/* ───────────── Collectors Tab ───────────── */}
            <TabsContent value="collectors" className="mt-6 space-y-8">
              {/* Add Collector */}
              <div className="grid md:grid-cols-4 gap-2 items-end">
                <Input placeholder="Name" value={newCollector.name} onChange={e => setNewCollector({ ...newCollector, name: e.target.value })} />
                <Input placeholder="Wallet" value={newCollector.wallet} onChange={e => setNewCollector({ ...newCollector, wallet: e.target.value })} />
                <Input placeholder="Text" value={newCollector.text} onChange={e => setNewCollector({ ...newCollector, text: e.target.value })} />
                <Button onClick={addCollector}><Plus className="mr-2 h-4 w-4"/>Add</Button>
              </div>

              {/* Edit Collector */}
              <div className="grid md:grid-cols-4 gap-2 items-end">
                <Input placeholder="Wallet (to edit)" value={editCollector.wallet} onChange={e => setEditCollector({ ...editCollector, wallet: e.target.value })} />
                <Input placeholder="New Name" value={editCollector.name} onChange={e => setEditCollector({ ...editCollector, name: e.target.value })} />
                <Input placeholder="New Text" value={editCollector.text} onChange={e => setEditCollector({ ...editCollector, text: e.target.value })} />
                <Button variant="outline" onClick={editCollectorSubmit}>Edit</Button>
              </div>

              {/* Collectors Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-2 py-1 text-left">ID</th>
                      <th className="px-2 py-1 text-left">Timestamp</th>
                      <th className="px-2 py-1 text-left">Name</th>
                      <th className="px-2 py-1 text-left">Wallet</th>
                      <th className="px-2 py-1 text-left">Text</th>
                      <th className="px-2 py-1"/>
                    </tr>
                  </thead>
                  <tbody>
                    {collectors.map(c => (
                      <tr key={c.collector_id.toString()} className="border-b">
                        <td className="px-2 py-1">{c.collector_id.toString()}</td>
                        <td className="px-2 py-1">{nsToDate(BigInt(c.timestamp)).toLocaleString()}</td>
                        <td className="px-2 py-1">{c.name}</td>
                        <td className="px-2 py-1 font-mono text-xs break-all">{c.wallet}</td>
                        <td className="px-2 py-1">{c.text}</td>
                        <td className="px-2 py-1 text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteCollector(c.wallet)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button variant="destructive" onClick={deleteAllCollectors}>
                <Trash2 className="h-4 w-4 mr-2"/>Delete All Collectors
              </Button>
            </TabsContent>

            {/* ───────────── Purchases Tab ───────────── */}
            <TabsContent value="purchases" className="mt-6 space-y-8">
              {/* Add Purchase */}
              <div className="grid md:grid-cols-5 gap-2 items-end">
                <Input placeholder="Wallet" value={newPurchase.wallet} onChange={e => setNewPurchase({ ...newPurchase, wallet: e.target.value })} />
                <Input placeholder="Tx Hash" value={newPurchase.tx_id} onChange={e => setNewPurchase({ ...newPurchase, tx_id: e.target.value })} />
                <Input placeholder="Link" value={newPurchase.link} onChange={e => setNewPurchase({ ...newPurchase, link: e.target.value })} />
                <Input placeholder="Text" value={newPurchase.text} onChange={e => setNewPurchase({ ...newPurchase, text: e.target.value })} />
                <Button onClick={addPurchase}><Plus className="mr-2 h-4 w-4"/>Add</Button>
              </div>

              {/* Purchases Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-2 py-1 text-left">ID</th>
                      <th className="px-2 py-1 text-left">Timestamp</th>
                      <th className="px-2 py-1 text-left">Wallet</th>
                      <th className="px-2 py-1 text-left">Tx Hash</th>
                      <th className="px-2 py-1 text-left">Link</th>
                      <th className="px-2 py-1 text-left">Text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(p => (
                      <tr key={p.purchase_id.toString()} className="border-b">
                        <td className="px-2 py-1">{p.purchase_id.toString()}</td>
                        <td className="px-2 py-1">{nsToDate(BigInt(p.timestamp)).toLocaleString()}</td>
                        <td className="px-2 py-1 font-mono text-xs break-all">{p.wallet}</td>
                        <td className="px-2 py-1 font-mono text-xs break-all">{p.tx_id}</td>
                        <td className="px-2 py-1"><a href={p.link} className="underline" target="_blank" rel="noreferrer">link</a></td>
                        <td className="px-2 py-1">{p.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
