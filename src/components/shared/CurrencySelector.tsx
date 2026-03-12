"use client";

type Currency = "BRL" | "USD" | "EUR";

let _currency: Currency = "BRL";

export function useCurrency() {
  return {
    currency: _currency,
    setCurrency: (c: Currency) => {
      _currency = c;
    },
  };
}

export function CurrencySelector() {
  return (
    <select
      defaultValue="BRL"
      onChange={(e) => {
        _currency = e.target.value as Currency;
      }}
      className="admin-input text-xs py-1.5 px-3 w-[80px]"
    >
      <option value="BRL">R$</option>
      <option value="USD">US$</option>
      <option value="EUR">EUR</option>
    </select>
  );
}
