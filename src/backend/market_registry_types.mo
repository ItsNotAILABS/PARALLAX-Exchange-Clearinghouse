module {
  public type MarketStatus = { #research; #planned; #testnet; #mainnet; #deprecated };
  public type MarketSpec = {
    tick_size : Text;
    min_order_quantity : Text;
    settlement_cadence_ms : Nat;
    max_open_orders_per_principal_per_pair : Nat;
    maker_fee_bps : Nat;
    taker_fee_bps : Nat;
  };
  public type PairInfo = {
    pair_id : Text;
    display : Text;
    base : Text;
    quote : Text;
    category : Text;
    status : MarketStatus;
    description : ?Text;
  };
  public func isTradable(status : MarketStatus) : Bool {
    switch (status) {
      case (#testnet) true;
      case (#mainnet) true;
      case (_) false;
    }
  };
};
