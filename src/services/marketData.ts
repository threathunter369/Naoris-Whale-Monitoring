import { useState, useEffect } from 'react';

export interface Candlestick {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface MarketData {
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: number;
  candlesticks: Candlestick[];
  orderBook: {
    asks: OrderBookEntry[];
    bids: OrderBookEntry[];
  };
}

export function useMarketData() {
  const [data, setData] = useState<MarketData>(() => {
    // Generate initial candlesticks for the last 60 minutes
    const initialCandles: Candlestick[] = [];
    let lastPrice = 0.1365;
    const now = Date.now();
    for (let i = 60; i >= 0; i--) {
      const open = lastPrice;
      const variation = (Math.random() - 0.5) * 0.002;
      const close = open + variation;
      const high = Math.max(open, close) + Math.random() * 0.001;
      const low = Math.min(open, close) - Math.random() * 0.001;
      const volume = Math.random() * 1000000;
      initialCandles.push({
        time: now - i * 60000,
        open,
        high,
        low,
        close,
        volume
      });
      lastPrice = close;
    }

    return {
      price: lastPrice,
      change24h: 7.02,
      marketCap: 124500000,
      volume24h: 28990000,
      lastUpdated: now,
      candlesticks: initialCandles,
      orderBook: generateOrderBook(lastPrice)
    };
  });

  useEffect(() => {
    const updateMarket = () => {
      setData(prev => {
        const volatility = (Math.random() - 0.5) * 0.0005;
        const newPrice = prev.price * (1 + volatility);
        
        // Update last candle or add new one
        const lastCandle = prev.candlesticks[prev.candlesticks.length - 1];
        const now = Date.now();
        const newCandles = [...prev.candlesticks];
        
        if (now - lastCandle.time > 60000) {
          // New minute
          newCandles.shift();
          newCandles.push({
            time: Math.floor(now / 60000) * 60000,
            open: lastCandle.close,
            high: Math.max(lastCandle.close, newPrice),
            low: Math.min(lastCandle.close, newPrice),
            close: newPrice,
            volume: Math.random() * 50000
          });
        } else {
          // Update current minute IMMUTABLY
          const updatedLastCandle = {
            ...lastCandle,
            close: newPrice,
            high: Math.max(lastCandle.high, newPrice),
            low: Math.min(lastCandle.low, newPrice),
            volume: lastCandle.volume + Math.random() * 1000
          };
          newCandles[newCandles.length - 1] = updatedLastCandle;
        }

        return {
          ...prev,
          price: newPrice,
          candlesticks: newCandles,
          orderBook: generateOrderBook(newPrice),
          lastUpdated: now
        };
      });
    };

    const interval = setInterval(updateMarket, 2000);
    return () => clearInterval(interval);
  }, []);

  return data;
}

function generateOrderBook(basePrice: number) {
  const asks: OrderBookEntry[] = [];
  const bids: OrderBookEntry[] = [];
  
  let askTotal = 0;
  let bidTotal = 0;

  for (let i = 0; i < 10; i++) {
    const askPrice = basePrice + (i + 1) * 0.0001;
    const askAmount = Math.random() * 5000;
    askTotal += askAmount * askPrice;
    asks.push({ price: askPrice, amount: askAmount, total: askTotal });

    const bidPrice = basePrice - (i + 1) * 0.0001;
    const bidAmount = Math.random() * 5000;
    bidTotal += bidAmount * bidPrice;
    bids.push({ price: bidPrice, amount: bidAmount, total: bidTotal });
  }

  return { asks: asks.reverse(), bids };
}
