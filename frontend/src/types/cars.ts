export interface Equipment {
    id: number;
    name: string;
    price: number;
  }
  
  export interface CarModel {
    id: number;
    name: string;
    brand_name?: string;
    min_price?: number | null;
    image?: string | null;
    equipments?: Equipment[];
  }
  