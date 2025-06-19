import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Text "mo:base/Text";
import Time "mo:base/Time";

// ───────────────────────────────────────────
//  Simple two‑table database canister (Motoko)
//  • Collectors  – id + wallet metadata
//  • Purchases   – id + tx metadata
//  Uses stable vars; no auth logic yet.
// ───────────────────────────────────────────

actor {
  // ─────────── Types ────────────
  public type Collector = {
    collector_id : Nat;
    timestamp    : Int;  // Time.now() nanoseconds
    name         : Text;
    wallet       : Text; // Ethereum wallet address
    text         : Text;
  };

  public type Purchase = {
    purchase_id : Nat;
    timestamp   : Int;
    wallet      : Text;
    tx_id       : Text;
    link        : Text;
    text        : Text;
  };

  // ─────────── Stable state ────────────
  stable var nextCollectorId : Nat = 0;
  stable var nextPurchaseId  : Nat = 0;
  stable var collectors : [Collector] = [];
  stable var purchases  : [Purchase]  = [];

  // ─────────── Helpers ────────────
  private func json_escape(t : Text) : Text {
    let step1 = Text.replace(t, #text "\\", "\\\\");
    Text.replace(step1, #text "\"", "\\\"");
  };

  private func collectors_to_json(arr : [Collector]) : Text {
    var out : Text = "[";
    var first = true;
    for (c in arr.vals()) {
      if (first) { first := false } else { out #= "," };
      out #= "{\"collector_id\":" # Nat.toText(c.collector_id) #
             ",\"timestamp\":\"" # Int.toText(c.timestamp) # "\"" #
             ",\"name\":\"" # json_escape(c.name) # "\"" #
             ",\"wallet\":\"" # json_escape(c.wallet) # "\"" #
             ",\"text\":\"" # json_escape(c.text) # "\"}";
    };
    out #= "]";
    out
  };

  private func purchases_to_json(arr : [Purchase]) : Text {
    var out : Text = "[";
    var first = true;
    for (p in arr.vals()) {
      if (first) { first := false } else { out #= "," };
      out #= "{\"purchase_id\":" # Nat.toText(p.purchase_id) #
             ",\"timestamp\":\"" # Int.toText(p.timestamp) # "\"" #
             ",\"wallet\":\"" # json_escape(p.wallet) # "\"" #
             ",\"tx_id\":\"" # json_escape(p.tx_id) # "\"" #
             ",\"link\":\"" # json_escape(p.link) # "\"" #
             ",\"text\":\"" # json_escape(p.text) # "\"}";
    };
    out #= "]";
    out
  };

  // ─────────── Collectors API ────────────
  public func add_collector(name : Text, wallet : Text, text : Text) : async Nat {
    let cid = nextCollectorId;
    nextCollectorId += 1;
    let entry : Collector = {
      collector_id = cid;
      timestamp    = Time.now();
      name         = name;
      wallet       = wallet;
      text         = text;
    };
    collectors := Array.append<Collector>(collectors, [entry]);
    cid
  };

  public func edit_collector(wallet : Text, name : ?Text, text : ?Text) : async Bool {
    var edited = false;
    collectors := Array.map<Collector, Collector>(collectors, func c {
      if (c.wallet == wallet) {
        edited := true;
        {
          collector_id = c.collector_id;
          timestamp    = c.timestamp;
          name         = Option.get(name, c.name);
          wallet       = c.wallet;
          text         = Option.get(text, c.text);
        }
      } else {
        c
      }
    });
    edited
  };

  public func delete_collector(wallet : Text) : async Bool {
    var removed = false;
    let buf = Buffer.Buffer<Collector>(collectors.size());
    for (c in collectors.vals()) {
      if (c.wallet == wallet) {
        removed := true
      } else {
        buf.add(c)
      }
    };
    collectors := buf.toArray();
    removed
  };

  public func delete_all_collectors() : async () {
    collectors := []
  };

  public query func get_collectors() : async [Collector] { collectors };
  public query func get_collectors_json() : async Text { collectors_to_json(collectors) };

  // ─────────── Purchases API ────────────
  public func add_purchase(wallet : Text, tx_id : Text, link : Text, text : Text) : async Nat {
    let pid = nextPurchaseId;
    nextPurchaseId += 1;
    let entry : Purchase = {
      purchase_id = pid;
      timestamp   = Time.now();
      wallet      = wallet;
      tx_id       = tx_id;
      link        = link;
      text        = text;
    };
    purchases := Array.append<Purchase>(purchases, [entry]);
    pid
  };

  public query func get_purchases() : async [Purchase] { purchases };
  public query func get_purchases_json() : async Text { purchases_to_json(purchases) };
}
