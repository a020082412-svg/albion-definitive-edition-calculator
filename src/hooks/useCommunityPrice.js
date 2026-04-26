import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useCommunityPrice(item, city) {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchPrice = useCallback(async () => {
    if (!item || !city) {
      setPriceData(null);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        API_BASE + '/price?item=' + encodeURIComponent(item) + '&city=' + encodeURIComponent(city),
        { signal: abortRef.current.signal }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error ' + res.status);
      }
      const data = await res.json();
      setPriceData(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setPriceData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [item, city]);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => {
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchPrice]);

  return { priceData, loading, error, refetch: fetchPrice };
}

export async function submitPriceReport({ item, city, buyPrice, sellPrice, userId }) {
  const res = await fetch(API_BASE + '/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      item: item.trim().toUpperCase(),
      city: city.trim(),
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      userId: userId || undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error ' + res.status);
  return data;
}