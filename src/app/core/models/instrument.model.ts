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
}

//compatibility for reference "Instrument3"
export type Instrument3 = Instrument;