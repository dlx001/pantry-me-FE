export interface Item {
  id: number;
  name: string;
  expirationDate: Date;
  userId: string;
  listId: number;
}

export interface GroceryItem {
  id: string | number;
  name: string;
  brand?: string;
  unit: string;
  price: string;
  image_url?: string;
  store: string;
}

export interface List {
  id: number;
  name: string;
  userId: string;
  items: GroceryItem[];
  createdAt?: string;
}
