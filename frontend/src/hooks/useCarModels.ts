import { useEffect, useState } from "react";
import { fetchCarModels } from "../services/carModels";
import type { CarModel } from "../types/cars";

export function useCarModels() {
  const [cars, setCars] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCarModels();
      setCars(data);
    } catch (e) {
      setError((e as Error).message ?? "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { cars, loading, error, reload: load };
}
