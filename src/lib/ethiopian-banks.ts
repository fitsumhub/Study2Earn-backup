export type EthiopianBank = {
  id: string;
  name: string;
  short: string;
  color: string;
  accent: string;
};

export const ethiopianBanks: EthiopianBank[] = [
  {
    id: "cbe",
    name: "Commercial Bank of Ethiopia",
    short: "CBE",
    color: "#1B7A3D",
    accent: "#E8F5E9",
  },
  {
    id: "awash",
    name: "Awash Bank",
    short: "Awash",
    color: "#003DA5",
    accent: "#E3F2FD",
  },
  {
    id: "dashen",
    name: "Dashen Bank",
    short: "Dashen",
    color: "#E31937",
    accent: "#FFEBEE",
  },
  {
    id: "abyssinia",
    name: "Bank of Abyssinia",
    short: "BoA",
    color: "#1E3A8A",
    accent: "#E8EAF6",
  },
  {
    id: "united",
    name: "United Bank",
    short: "United",
    color: "#0066B3",
    accent: "#E1F5FE",
  },
  {
    id: "nib",
    name: "Nib International Bank",
    short: "Nib",
    color: "#0F2B5B",
    accent: "#E8EAF6",
  },
  {
    id: "cbo",
    name: "Cooperative Bank of Oromia",
    short: "CBO",
    color: "#006B3F",
    accent: "#E8F5E9",
  },
  {
    id: "oromia",
    name: "Oromia International Bank",
    short: "OIB",
    color: "#15803D",
    accent: "#DCFCE7",
  },
  {
    id: "lion",
    name: "Lion International Bank",
    short: "Lion",
    color: "#F7941D",
    accent: "#FFF3E0",
  },
  {
    id: "wegagen",
    name: "Wegagen Bank",
    short: "Wegagen",
    color: "#00A651",
    accent: "#E8F5E9",
  },
  {
    id: "zemen",
    name: "Zemen Bank",
    short: "Zemen",
    color: "#8B0000",
    accent: "#FFEBEE",
  },
  {
    id: "bunna",
    name: "Bunna International Bank",
    short: "Bunna",
    color: "#4A2C2A",
    accent: "#EFEBE9",
  },
  {
    id: "berhan",
    name: "Berhan Bank",
    short: "Berhan",
    color: "#B8860B",
    accent: "#FFF8E1",
  },
  {
    id: "abay",
    name: "Abay Bank",
    short: "Abay",
    color: "#1E40AF",
    accent: "#DBEAFE",
  },
  {
    id: "addis",
    name: "Addis International Bank",
    short: "Addis",
    color: "#7C3AED",
    accent: "#EDE9FE",
  },
];

export function getBankById(id: string) {
  return ethiopianBanks.find((b) => b.id === id);
}
