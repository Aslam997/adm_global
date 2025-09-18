import axios from "axios";
import { BaseUrl } from "./api";

export interface CompareItem {
  id?: number;
  name: string;
  price: number;
  brand_name?: string;
  car_name?: string;
  image?: string | null;
}

export const COMPARE_API = BaseUrl + "compare/list/";
export const SELECTED_API = BaseUrl + "selected/equipments/";

export async function fetchCompareList(): Promise<CompareItem[]> {
  const res = await axios.get(COMPARE_API);
  const payload = res.data;
  return Array.isArray(payload) ? payload : payload?.results ?? [];
}
