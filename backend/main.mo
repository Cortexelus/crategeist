// SPDX‑License‑Identifier: Apache‑2.0
import Array  "mo:base/Array";
import Option "mo:base/Option";
import Time   "mo:base/Time";

actor Collectors {
  ////////////////////////////////////////////////////////////////////
  // 1. Data Types
  public type Collector = {
    collector_id : Nat;
    timestamp    : Nat64;   // nanoseconds since epoch
    name         : Text;
    wallet       : Text;    // Ethereum address 0x…
    text         : Text;
  };

  public type Purchase = {
    purchase_id : Nat;
    timestamp   : Nat64;
    wallet      : Text;     // buyer wallet
    tx          : Text;     // Ethereum tx hash
    link        : Text;     // e.g. NFT URL / IPFS
    text        : Text;
  };

  ////////////////////////////////////////////////////////////////////
  // 2. Stable Storage
  stable var collectors : [Collector] = [];
  stable var purchases  : [Purchase]  = [];

  func now() : Nat64 = Time.now();

  ////////////////////////////////////////////////////////////////////
  // 3. Collectors API
  public shared({caller}) func addCollector(name : Text, wallet : Text, text : Text) : async Nat {
    let id = collectors.size();
    let c : Collector = {
      collector_id = id;
      timestamp    = now();
      name         = name;
      wallet       = wallet;
      text         = text;
    };
    collectors := Array.append(collectors, [c]);
    id
  };

  public shared({caller}) func editCollector(wallet : Text, name : ?Text, newText : ?Text) : async Bool {
    var changed = false;
    collectors := Array.map(collectors, func (c : Collector) : Collector {
      if (c.wallet == wallet) {
        changed := true;
        {
          c with
          name = Option.get(name, c.name);
          text = Option.get(newText, c.text);
        }
      } else c
    });
    changed
  };

  public shared({caller}) func deleteCollector(wallet : Text) : async Bool {
    let before = collectors.size();
    collectors := Array.filter<Collector>(collectors, func c = (c.wallet != wallet));
    collectors.size() < before
  };

  public shared({caller}) func deleteAllCollectors() : async () {
    collectors := [];
  };

  public query func getCollectors() : async [Collector] {
    collectors
  };

  ////////////////////////////////////////////////////////////////////
  // 4. Purchases API
  public shared({caller}) func addPurchase(wallet : Text, tx : Text, link : Text, text : Text) : async Nat {
    let id = purchases.size();
    let p : Purchase = {
      purchase_id = id;
      timestamp   = now();
      wallet      = wallet;
      tx          = tx;
      link        = link;
      text        = text;
    };
    purchases := Array.append(purchases, [p]);
    id
  };

  public query func getPurchases() : async [Purchase] {
    purchases
  };
}