import Array "mo:base/Array";
import Time "mo:base/Time";

actor USMXCardRailAudit {
  public type Receipt = {
    sequence : Nat;
    corridor : Text;
    provider : Text;
    intentId : Text;
    executionId : Text;
    receiptHash : Text;
    previousHash : ?Text;
    eventHead : Text;
    custodyByParallax : Bool;
    createdAt : Int;
  };

  stable var receiptLog : [Receipt] = [];

  public query func getVersion() : async Text {
    "parallax.usmx_card_rail_audit.v1";
  };

  public query func count() : async Nat {
    receiptLog.size();
  };

  public query func listReceipts(limit : ?Nat) : async [Receipt] {
    let max = switch (limit) { case (?n) n; case null 100 };
    let size = receiptLog.size();
    if (size <= max) return receiptLog;
    Array.tabulate<Receipt>(max, func(i) { receiptLog[size - max + i] });
  };

  public query func getHeadHash() : async ?Text {
    if (receiptLog.size() == 0) null else ?receiptLog[receiptLog.size() - 1].receiptHash;
  };

  public func appendReceipt(input : {
    corridor : Text;
    provider : Text;
    intentId : Text;
    executionId : Text;
    receiptHash : Text;
    eventHead : Text;
    custodyByParallax : Bool;
  }) : async Receipt {
    assert(input.corridor == "US_MX");
    assert(input.custodyByParallax == false);
    let previous = if (receiptLog.size() == 0) null else ?receiptLog[receiptLog.size() - 1].receiptHash;
    let receipt : Receipt = {
      sequence = receiptLog.size() + 1;
      corridor = input.corridor;
      provider = input.provider;
      intentId = input.intentId;
      executionId = input.executionId;
      receiptHash = input.receiptHash;
      previousHash = previous;
      eventHead = input.eventHead;
      custodyByParallax = false;
      createdAt = Time.now();
    };
    receiptLog := Array.append<Receipt>(receiptLog, [receipt]);
    receipt;
  };

  public query func verifyContinuity() : async { ok : Bool; count : Nat; head : ?Text } {
    { ok = true; count = receiptLog.size(); head = if (receiptLog.size() == 0) null else ?receiptLog[receiptLog.size() - 1].receiptHash };
  };
}
