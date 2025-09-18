import axios from "axios";
import { BaseUrl } from "./api";
import type { CarModel } from "../types/cars";

const API_URL = BaseUrl + "carmodels/list/";

export async function fetchCarModels(): Promise<CarModel[]> {
  const res = await axios.get(API_URL);
  const payload = res.data;
  return Array.isArray(payload) ? payload : (payload?.results ?? []);
}
