/**
 * CoinGecko API integration for real-time cryptocurrency price data.
 * Provides price fetching, historical data, and market information.
 */

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 1000;

// Common ticker to CoinGecko ID mapping
const TICKER_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  TON: "the-open-network",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  DOT: "polkadot",
  LINK: "chainlink",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  UNI: "uniswap",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  ATOM: "cosmos",
  FIL: "filecoin",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
};

export interface PriceData {
  ticker: string;
  coinGeckoId: string;
  priceUsd: number;
  priceBtc: number;
  priceEth: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  priceChangePercentage1h: number;
  priceChangePercentage7d: number;
  lastUpdated: number; // Unix timestamp in seconds
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
}

/**
 * Normalize a ticker symbol to CoinGecko ID.
 * Returns undefined if the ticker is not recognized.
 */
export function normalizeTickerToId(ticker: string): string | undefined {
  const upperTicker = ticker.toUpperCase();
  return TICKER_TO_ID[upperTicker];
}

/**
 * Get all supported tickers for autocomplete/suggestions.
 */
export function getSupportedTickers(): Array<{ ticker: string; id: string; name: string }> {
  return [
    { ticker: "BTC", id: "bitcoin", name: "Bitcoin" },
    { ticker: "ETH", id: "ethereum", name: "Ethereum" },
    { ticker: "TON", id: "the-open-network", name: "Toncoin" },
    { ticker: "SOL", id: "solana", name: "Solana" },
    { ticker: "XRP", id: "ripple", name: "XRP" },
    { ticker: "ADA", id: "cardano", name: "Cardano" },
    { ticker: "DOGE", id: "dogecoin", name: "Dogecoin" },
    { ticker: "DOT", id: "polkadot", name: "Polkadot" },
    { ticker: "LINK", id: "chainlink", name: "Chainlink" },
    { ticker: "AVAX", id: "avalanche-2", name: "Avalanche" },
    { ticker: "MATIC", id: "matic-network", name: "Polygon" },
    { ticker: "UNI", id: "uniswap", name: "Uniswap" },
    { ticker: "SHIB", id: "shiba-inu", name: "Shiba Inu" },
    { ticker: "LTC", id: "litecoin", name: "Litecoin" },
    { ticker: "BCH", id: "bitcoin-cash", name: "Bitcoin Cash" },
    { ticker: "ATOM", id: "cosmos", name: "Cosmos" },
    { ticker: "FIL", id: "filecoin", name: "Filecoin" },
    { ticker: "APT", id: "aptos", name: "Aptos" },
    { ticker: "ARB", id: "arbitrum", name: "Arbitrum" },
    { ticker: "OP", id: "optimism", name: "Optimism" },
  ];
}

/**
 * Fetch current price data for a cryptocurrency.
 * Retries up to RETRY_LIMIT times on failure.
 */
export async function fetchPriceData(
  ticker: string,
  currency: string = "usd"
): Promise<PriceData | null> {
  const coinGeckoId = normalizeTickerToId(ticker);
  if (!coinGeckoId) {
    return null; // Unknown ticker
  }

  const url = new URL(`${COINGECKO_BASE_URL}/coins/${coinGeckoId}`);
  url.searchParams.set("localization", "false");
  url.searchParams.set("tickers", "false");
  url.searchParams.set("market_data", "true");
  url.searchParams.set("community_data", "false");
  url.searchParams.set("developer_data", "false");
  url.searchParams.set("sparkline", "false");

  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait and retry
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
          continue;
        }
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const marketData = data.market_data;

      return {
        ticker: ticker.toUpperCase(),
        coinGeckoId,
        priceUsd: marketData.current_price[currency] ?? 0,
        priceBtc: marketData.current_price.btc ?? 0,
        priceEth: marketData.current_price.eth ?? 0,
        marketCap: marketData.market_cap[currency] ?? 0,
        volume24h: marketData.total_volume[currency] ?? 0,
        priceChange24h: marketData.price_change_24h_in_currency[currency] ?? 0,
        priceChangePercentage24h: marketData.price_change_percentage_24h ?? 0,
        priceChangePercentage1h: marketData.price_change_percentage_1h_in_currency[currency] ?? 0,
        priceChangePercentage7d: marketData.price_change_percentage_7d_in_currency[currency] ?? 0,
        lastUpdated: Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      if (attempt === RETRY_LIMIT) {
        console.error(`Failed to fetch price for ${ticker} after ${RETRY_LIMIT} attempts:`, error);
        return null;
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }

  return null;
}

/**
 * Fetch prices for multiple tickers in parallel.
 * Respects CoinGecko rate limits by batching requests.
 */
export async function fetchMultiplePrices(
  tickers: string[],
  currency: string = "usd"
): Promise<Map<string, PriceData | null>> {
  const results = new Map<string, PriceData | null>();
  
  // Process in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((ticker) => fetchPriceData(ticker, currency))
    );
    
    batch.forEach((ticker, index) => {
      results.set(ticker, batchResults[index]);
    });
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < tickers.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * Get market overview data.
 */
export async function fetchMarketOverview(): Promise<MarketOverview | null> {
  try {
    const response = await fetch(`${COINGECKO_BASE_URL}/global`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const globalData = data.data;

    return {
      totalMarketCap: globalData.total_market_cap.usd ?? 0,
      totalVolume: globalData.total_volume.usd ?? 0,
      btcDominance: globalData.market_cap_percentage.btc ?? 0,
      ethDominance: globalData.market_cap_percentage.eth ?? 0,
      marketCapChange24h: globalData.market_cap_change_percentage_24h_usd ?? 0,
    };
  } catch (error) {
    console.error("Failed to fetch market overview:", error);
    return null;
  }
}

/**
 * Search for coins by name or symbol.
 * Returns top 5 matches.
 */
export async function searchCoins(query: string): Promise<Array<{ id: string; name: string; symbol: string; marketCapRank: number | null }>> {
  try {
    const url = new URL(`${COINGECKO_BASE_URL}/search`);
    url.searchParams.set("query", query);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.coins.slice(0, 5).map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      marketCapRank: coin.market_cap_rank,
    }));
  } catch (error) {
    console.error(`Failed to search coins for "${query}":`, error);
    return [];
  }
}

/**
 * Format price for display.
 */
export function formatPrice(price: number, currency: string = "USD"): string {
  if (price >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "USD" ? "USD" : currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } else if (price >= 0.01) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "USD" ? "USD" : currency.toUpperCase(),
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(price);
  } else {
    // Very small prices (like SHIB)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "USD" ? "USD" : currency.toUpperCase(),
      minimumFractionDigits: 6,
      maximumFractionDigits: 8,
    }).format(price);
  }
}

/**
 * Format percentage change for display.
 */
export function formatPercentageChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Format large numbers for display (market cap, volume).
 */
export function formatLargeNumber(number: number): string {
  if (number >= 1e12) {
    return `$${(number / 1e12).toFixed(2)}T`;
  } else if (number >= 1e9) {
    return `$${(number / 1e9).toFixed(2)}B`;
  } else if (number >= 1e6) {
    return `$${(number / 1e6).toFixed(2)}M`;
  } else if (number >= 1e3) {
    return `$${(number / 1e3).toFixed(2)}K`;
  } else {
    return `$${number.toFixed(2)}`;
  }
}