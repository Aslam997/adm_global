import { useEffect, useState } from "react";
import { fetchCompareList, type CompareItem } from "../services/compare";

export function useCompareList() {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompareList();
      setItems(data);
    } catch (e) {
      setError((e as Error).message ?? "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { items, loading, error, reload: load, setItems };
}
