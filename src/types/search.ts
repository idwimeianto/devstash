// What the command palette searches; loaded once by the app layout.
export interface SearchItem {
  id: string;
  title: string;
  typeName: string;
  // Short single-line excerpt of the description, content, URL or file name.
  preview: string | null;
}

export interface SearchCollection {
  id: string;
  name: string;
  itemCount: number;
}

export interface SearchData {
  items: SearchItem[];
  collections: SearchCollection[];
}
