import Array "mo:base/Array";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Types "Types";

actor AiAgentEconomy {
  stable var accounts : [Types.Account] = [];
  stable var balances : [Types.Balance] = [];
  stable var commands : [Types.Command] = [];
  stable var evaluations : [Types.Evaluation] = [];
  stable var receipts : [Types.Receipt] = [];
  stable var dailyUsage : [Types.DailyUsage] = [];
  stable var sequence : Nat = 0;

  private func now() : Int { Time.now() };
  private func next(prefix : Text) : Text { sequence += 1; prefix # ":" # Nat.toText(sequence) };
  private func day(t : Int) : Text { Int.toText(t / 86_400_000_000_000) };
  private func containsText(xs : [Text], x : Text) : Bool { Array.find<Text>(xs, func(v) { v == x }) != null };
  private func containsKind(xs : [Types.CommandKind], x : Types.CommandKind) : Bool { Array.find<Types.CommandKind>(xs, func(v) { v == x }) != null };
  private func findAccount(id : Text) : ?Types.Account { Array.find<Types.Account>(accounts, func(v) { v.walletId == id }) };
  private func findCommand(id : Text) : ?Types.Command { Array.find<Types.Command>(commands, func(v) { v.commandId == id }) };
  private func priorReceipt(walletId : Text) : ?Text {
    var result : ?Text = null;
    for (r in receipts.vals()) { if (r.walletId == walletId) result := ?r.receiptId };
    result
  };
  private func page<T>(xs : [T], cursor : ?Nat, limit : ?Nat) : Types.Page<T> {
    let start = switch cursor { case (?v) v; case null 0 };
    let requested = switch limit { case (?v) v; case null 50 };
    let capped = if (requested > 100) 100 else requested;
    var out : [T] = [];
    var i = start;
    while (i < xs.size() and out.size() < capped) { out := Array.append<T>(out, [xs[i]]); i += 1 };
    { items = out; nextCursor = if (i < xs.size()) ?i else null; total = xs.size() }
  };
  private func balanceOf(walletId : Text, asset : Text) : Nat {
    switch (Array.find<Types.Balance>(balances, func(v) { v.walletId == walletId and v.asset == asset })) { case (?v) v.amountE8s; case null 0 }
  };
  private func setBalance(walletId : Text, asset : Text, amount : Nat) {
    let t = now(); var found = false;
    balances := Array.map<Types.Balance, Types.Balance>(balances, func(v) {
      if (v.walletId == walletId and v.asset == asset) { found := true; { walletId; asset; amountE8s = amount; updatedAt = t } } else v
    });
    if (not found) balances := Array.append<Types.Balance>(balances, [{ walletId; asset; amountE8s = amount; updatedAt = t }]);
  };
  private func usageOf(walletId : Text, d : Text) : Types.DailyUsage {
    switch (Array.find<Types.DailyUsage>(dailyUsage, func(v) { v.walletId == walletId and v.day == d })) {
      case (?v) v;
      case null { walletId; day = d; notionalE8s = 0; commandCount = 0; updatedAt = now() };
    }
  };
  private func setUsage(nextUsage : Types.DailyUsage) {
    var found = false;
    dailyUsage := Array.map<Types.DailyUsage, Types.DailyUsage>(dailyUsage, func(v) {
      if (v.walletId == nextUsage.walletId and v.day == nextUsage.day) { found := true; nextUsage } else v
    });
    if (not found) dailyUsage := Array.append<Types.DailyUsage>(dailyUsage, [nextUsage]);
  };
  private func fingerprint(command : Types.Command, suffix : Text) : Text {
    command.commandId # ":" # command.walletId # ":" # command.asset # ":" # Nat.toText(command.amountE8s) # ":" # suffix
  };
  private func appendReceipt(r : Types.Receipt) : Types.Receipt { receipts := Array.append<Types.Receipt>(receipts, [r]); r };

  public shared ({ caller }) func createAccount(walletId : Text, agentId : Text, mode : Types.Mode, policy : Types.Policy) : async Types.Result<Types.Account> {
    if (findAccount(walletId) != null) return #err(["account_exists"]);
    let t = now();
    let account = { walletId; agentId; owner = caller; status = #active; mode; policy; createdAt = t; updatedAt = t };
    accounts := Array.append<Types.Account>(accounts, [account]);
    ignore appendReceipt({ receiptId = next("econr"); kind = #account_created; walletId; commandId = null; signalId = null; artifactHash = null; debitAsset = null; debitAmountE8s = 0; creditAsset = null; creditAmountE8s = 0; externalExecutionId = null; priorReceiptId = priorReceipt(walletId); payloadFingerprint = walletId # ":created"; createdAt = t });
    #ok(account)
  };

  public shared ({ caller }) func seedInternalBalance(walletId : Text, asset : Text, amountE8s : Nat) : async Types.Result<Types.Balance> {
    switch (findAccount(walletId)) {
      case null #err(["account_not_found"]);
      case (?a) { if (a.owner != caller) return #err(["owner_required"]); setBalance(walletId, asset, amountE8s); #ok({ walletId; asset; amountE8s; updatedAt = now() }) };
    }
  };

  public shared func submitCommand(command : Types.Command) : async Types.Result<Types.Evaluation> {
    let account = switch (findAccount(command.walletId)) { case null return #err(["account_not_found"]); case (?v) v };
    var reasons : [Text] = [];
    if (account.status == #paused) reasons := Array.append(reasons, ["wallet_paused"]);
    if (account.status == #halted) reasons := Array.append(reasons, ["wallet_halted"]);
    if (not containsKind(account.policy.allowedKinds, command.kind)) reasons := Array.append(reasons, ["command_kind_not_allowed"]);
    if (not containsText(account.policy.allowedAssets, command.asset)) reasons := Array.append(reasons, ["asset_not_allowed"]);
    switch command.counterpartyWalletId { case (?cp) { if (account.policy.allowedCounterparties.size() > 0 and not containsText(account.policy.allowedCounterparties, cp)) reasons := Array.append(reasons, ["counterparty_not_allowed"]) }; case null {} };
    let notional = switch command.priceE8s { case (?p) command.amountE8s * p / 100_000_000; case null command.amountE8s };
    let current = usageOf(command.walletId, day(now()));
    if (notional > account.policy.maxNotionalE8s) reasons := Array.append(reasons, ["max_notional_exceeded"]);
    if (current.notionalE8s + notional > account.policy.dailyLimitE8s) reasons := Array.append(reasons, ["daily_limit_exceeded"]);
    let needsHuman = notional >= account.policy.humanApprovalAboveE8s;
    if (needsHuman and command.approvedBy == ?account.owner) reasons := Array.append(reasons, ["ai_self_approval_blocked"]);
    let decision : Types.Decision = if (reasons.size() > 0) #rejected else if (needsHuman and command.approvedBy == null) #requires_human_approval else #approved;
    let evaluation = { evaluationId = next("econe"); commandId = command.commandId; walletId = command.walletId; decision; reasons; commandNotionalE8s = notional; projectedDailyE8s = current.notionalE8s + notional; evaluatedAt = now() };
    commands := Array.append<Types.Command>(commands, [command]); evaluations := Array.append<Types.Evaluation>(evaluations, [evaluation]);
    ignore appendReceipt({ receiptId = next("econr"); kind = #policy_evaluated; walletId = command.walletId; commandId = ?command.commandId; signalId = switch command.signal { case (?s) ?s.signalId; case null null }; artifactHash = command.artifactHash; debitAsset = null; debitAmountE8s = 0; creditAsset = null; creditAmountE8s = 0; externalExecutionId = null; priorReceiptId = priorReceipt(command.walletId); payloadFingerprint = fingerprint(command, "evaluated"); createdAt = now() });
    #ok(evaluation)
  };

  public shared ({ caller }) func executeApproved(commandId : Text, externalExecutionId : ?Text) : async Types.Result<Types.Receipt> {
    let command = switch (findCommand(commandId)) { case null return #err(["command_not_found"]); case (?v) v };
    let account = switch (findAccount(command.walletId)) { case null return #err(["account_not_found"]); case (?v) v };
    if (account.owner != caller) return #err(["owner_required"]);
    let evaluation = switch (Array.find<Types.Evaluation>(evaluations, func(v) { v.commandId == commandId })) { case null return #err(["evaluation_not_found"]); case (?v) v };
    if (evaluation.decision != #approved) return #err(["command_not_approved"]);
    let t = now(); var debitAsset : ?Text = null; var debitAmount : Nat = 0; var creditAsset : ?Text = null; var creditAmount : Nat = 0; var kind : Types.ReceiptKind = #paper_order_filled;
    switch command.kind {
      case (#paper_order) {
        let quote = "PXUSD"; let available = balanceOf(command.walletId, quote);
        if (available < evaluation.commandNotionalE8s) return #err(["insufficient_pxusd"]);
        setBalance(command.walletId, quote, available - evaluation.commandNotionalE8s);
        let position = switch command.symbol { case (?s) s; case null command.asset };
        setBalance(command.walletId, position, balanceOf(command.walletId, position) + command.amountE8s);
        debitAsset := ?quote; debitAmount := evaluation.commandNotionalE8s; creditAsset := ?position; creditAmount := command.amountE8s; kind := #paper_order_filled;
      };
      case (#research_mint) { setBalance(command.walletId, "PXAI", balanceOf(command.walletId, "PXAI") + command.amountE8s); creditAsset := ?"PXAI"; creditAmount := command.amountE8s; kind := #research_credit_minted };
      case (#internal_transfer) {
        let target = switch command.counterpartyWalletId { case null return #err(["counterparty_required"]); case (?v) v };
        let available = balanceOf(command.walletId, command.asset); if (available < command.amountE8s) return #err(["insufficient_balance"]);
        setBalance(command.walletId, command.asset, available - command.amountE8s); setBalance(target, command.asset, balanceOf(target, command.asset) + command.amountE8s);
        debitAsset := ?command.asset; debitAmount := command.amountE8s; creditAsset := ?command.asset; creditAmount := command.amountE8s; kind := #internal_transfer_settled;
      };
      case (#compute_run) {
        let available = balanceOf(command.walletId, "PXGPU"); if (available < command.amountE8s) return #err(["insufficient_pxgpu"]);
        setBalance(command.walletId, "PXGPU", available - command.amountE8s); setBalance(command.walletId, "PXCRED", balanceOf(command.walletId, "PXCRED") + command.amountE8s);
        debitAsset := ?"PXGPU"; debitAmount := command.amountE8s; creditAsset := ?"PXCRED"; creditAmount := command.amountE8s; kind := #compute_completed;
      };
    };
    let u = usageOf(command.walletId, day(t)); setUsage({ u with notionalE8s = u.notionalE8s + evaluation.commandNotionalE8s; commandCount = u.commandCount + 1; updatedAt = t });
    let r = appendReceipt({ receiptId = next("econr"); kind; walletId = command.walletId; commandId = ?command.commandId; signalId = switch command.signal { case (?s) ?s.signalId; case null null }; artifactHash = command.artifactHash; debitAsset; debitAmountE8s = debitAmount; creditAsset; creditAmountE8s = creditAmount; externalExecutionId; priorReceiptId = priorReceipt(command.walletId); payloadFingerprint = fingerprint(command, "executed"); createdAt = t });
    #ok(r)
  };

  public shared ({ caller }) func setStatus(walletId : Text, status : Types.Status) : async Types.Result<Types.Account> {
    let account = switch (findAccount(walletId)) { case null return #err(["account_not_found"]); case (?v) v };
    if (account.owner != caller) return #err(["owner_required"]);
    let updated = { account with status; updatedAt = now() };
    accounts := Array.map<Types.Account, Types.Account>(accounts, func(v) { if (v.walletId == walletId) updated else v });
    #ok(updated)
  };

  public query func getBalance(walletId : Text, asset : Text) : async Nat { balanceOf(walletId, asset) };
  public query func listBalances(walletId : Text) : async [Types.Balance] { Array.filter<Types.Balance>(balances, func(v) { v.walletId == walletId }) };
  public query func listAccounts(cursor : ?Nat, limit : ?Nat) : async Types.Page<Types.Account> { page(accounts, cursor, limit) };
  public query func listCommands(walletId : Text, cursor : ?Nat, limit : ?Nat) : async Types.Page<Types.Command> { page(Array.filter<Types.Command>(commands, func(v) { v.walletId == walletId }), cursor, limit) };
  public query func listReceipts(walletId : ?Text, cursor : ?Nat, limit : ?Nat) : async Types.Page<Types.Receipt> {
    let xs = switch walletId { case null receipts; case (?id) Array.filter<Types.Receipt>(receipts, func(v) { v.walletId == id }) };
    page(xs, cursor, limit)
  };
  public query func listDailyUsage(walletId : Text, cursor : ?Nat, limit : ?Nat) : async Types.Page<Types.DailyUsage> { page(Array.filter<Types.DailyUsage>(dailyUsage, func(v) { v.walletId == walletId }), cursor, limit) };
}
