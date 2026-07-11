module {
  public type Mode = { #paper; #testnet };
  public type Status = { #active; #paused; #halted };
  public type CommandKind = { #paper_order; #research_mint; #internal_transfer; #compute_run };
  public type Decision = { #approved; #rejected; #requires_human_approval };

  public type Policy = {
    policyId : Text;
    allowedAssets : [Text];
    allowedCounterparties : [Text];
    allowedKinds : [CommandKind];
    maxNotionalE8s : Nat;
    dailyLimitE8s : Nat;
    humanApprovalAboveE8s : Nat;
  };

  public type Account = {
    walletId : Text;
    agentId : Text;
    owner : Principal;
    status : Status;
    mode : Mode;
    policy : Policy;
    createdAt : Int;
    updatedAt : Int;
  };

  public type HftSignal = {
    signalId : Text;
    strategyId : Text;
    symbol : Text;
    side : Text;
    confidenceBps : Nat;
    observedPriceE8s : Nat;
    observedAt : Int;
    featureHash : Text;
  };

  public type Command = {
    commandId : Text;
    walletId : Text;
    kind : CommandKind;
    asset : Text;
    amountE8s : Nat;
    symbol : ?Text;
    priceE8s : ?Nat;
    counterpartyWalletId : ?Text;
    artifactHash : ?Text;
    signal : ?HftSignal;
    memo : ?Text;
    approvalId : ?Text;
    approvedBy : ?Principal;
    createdAt : Int;
  };

  public type Evaluation = {
    evaluationId : Text;
    commandId : Text;
    walletId : Text;
    decision : Decision;
    reasons : [Text];
    commandNotionalE8s : Nat;
    projectedDailyE8s : Nat;
    evaluatedAt : Int;
  };

  public type Balance = {
    walletId : Text;
    asset : Text;
    amountE8s : Nat;
    updatedAt : Int;
  };

  public type DailyUsage = {
    walletId : Text;
    day : Text;
    notionalE8s : Nat;
    commandCount : Nat;
    updatedAt : Int;
  };

  public type ReceiptKind = {
    #account_created;
    #policy_evaluated;
    #paper_order_filled;
    #research_credit_minted;
    #internal_transfer_settled;
    #compute_completed;
    #account_paused;
    #account_resumed;
    #account_halted;
  };

  public type Receipt = {
    receiptId : Text;
    kind : ReceiptKind;
    walletId : Text;
    commandId : ?Text;
    signalId : ?Text;
    artifactHash : ?Text;
    debitAsset : ?Text;
    debitAmountE8s : Nat;
    creditAsset : ?Text;
    creditAmountE8s : Nat;
    externalExecutionId : ?Text;
    priorReceiptId : ?Text;
    payloadFingerprint : Text;
    createdAt : Int;
  };

  public type Page<T> = { items : [T]; nextCursor : ?Nat; total : Nat };
  public type Result<T> = { #ok : T; #err : [Text] };
}
