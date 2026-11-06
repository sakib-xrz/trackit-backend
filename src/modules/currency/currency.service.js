const httpStatus = require("http-status");
const config = require("../../config");
const ApiError = require("../../utils/ApiError");

const FALLBACK_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  MYR: 4.45,
  BDT: 120.0,
  INR: 84.0,
  AUD: 1.52,
  CAD: 1.38,
  SGD: 1.34,
  JPY: 152.5,
};

const fetchRates = async (base = "USD") => {
  const upperBase = base.toUpperCase();
  try {
    const response = await fetch(
      `${config.exchange_rate_api_url}/${upperBase}`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        return {
          base_currency: upperBase,
          source: "live_api",
          rates: data.rates,
        };
      }
    }
  } catch (err) {
    // Fallback to static calculation if network fails
  }

  const baseRate = FALLBACK_RATES[upperBase] || 1.0;
  const computedRates = {};
  for (const [code, rate] of Object.entries(FALLBACK_RATES)) {
    computedRates[code] = Number((rate / baseRate).toFixed(4));
  }

  return {
    base_currency: upperBase,
    source: "fallback_cache",
    rates: computedRates,
  };
};

const convertCurrency = async ({ from = "USD", to = "MYR", amount = 1 }) => {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid amount for currency conversion",
    );
  }

  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();
  const rateData = await fetchRates(fromUpper);

  const targetRate = rateData.rates[toUpper];
  if (!targetRate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Unsupported target currency code: ${toUpper}`,
    );
  }

  const converted_amount = Number((numAmount * targetRate).toFixed(2));

  return {
    from_currency: fromUpper,
    to_currency: toUpper,
    original_amount: numAmount,
    exchange_rate: targetRate,
    converted_amount,
    rate_source: rateData.source,
  };
};

module.exports = {
  fetchRates,
  convertCurrency,
};
