export interface Instrument {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  description: string;
  family?: string;
  subfamily?: string;
  longDescription?: string;
  specifications?: { [key: string]: string | number | boolean };
  materials?: string;
  dimensions?: string;
  weight?: string;
  warranty?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
}

//compatibility for reference "Instrument3"
export type Instrument3 = Instrument;