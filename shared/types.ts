export interface Item {
  id: number;
  name: string;
  expirationDate: Date;
  userId: string;
  listId: number;
}

export interface List {
  id: number;
  name: string;
  userId: string;
  items: Item[];
}
