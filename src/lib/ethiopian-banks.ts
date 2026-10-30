export type EthiopianBank = {
  id: string;
  name: string;
  short: string;
  color: string;
  accent: string;
  logoUrl?: string;
};

export const ethiopianBanks: EthiopianBank[] = [
  {
    id: "cbe",
    name: "Commercial Bank of Ethiopia",
    short: "CBE",
    color: "#5B2182",
    accent: "#FAF5FF",
    logoUrl: "/banks/cbe.svg",
  },
  {
    id: "awash",
    name: "Awash Bank",
    short: "Awash",
    color: "#003366",
    accent: "#F0F9FF",
    logoUrl: "/banks/awash.svg",
  },
  {
    id: "dashen",
    name: "Dashen Bank",
    short: "Dashen",
    color: "#0C2340",
    accent: "#FEF2F2",
    logoUrl: "/banks/dashen.png",
  },
  {
    id: "abyssinia",
    name: "Bank of Abyssinia",
    short: "BoA",
    color: "#0B1B3D",
    accent: "#FFFBEB",
    logoUrl: "/banks/abyssinia.svg",
  },
  {
    id: "united",
    name: "Hibret Bank (United)",
    short: "Hibret",
    color: "#EA580C",
    accent: "#FFF7ED",
    logoUrl: "/banks/united.svg",
  },
  {
    id: "nib",
    name: "Nib International Bank",
    short: "Nib",
    color: "#0F2B5B",
    accent: "#FEFCE8",
    logoUrl: "/banks/nib.png",
  },
  {
    id: "cbo",
    name: "Cooperative Bank of Oromia",
    short: "CBO",
    color: "#006837",
    accent: "#F0FDF4",
    logoUrl: "/banks/cbo.svg",
  },
  {
    id: "oromia",
    name: "Oromia International Bank",
    short: "OIB",
    color: "#007A3D",
    accent: "#F0FDF4",
    logoUrl: "/banks/oromia.svg",
  },
  {
    id: "lion",
    name: "Lion International Bank",
    short: "Lion",
    color: "#C2410C",
    accent: "#FFF7ED",
    logoUrl: "/banks/lion.png",
  },
  {
    id: "wegagen",
    name: "Wegagen Bank",
    short: "Wegagen",
    color: "#DC2626",
    accent: "#FEF2F2",
    logoUrl: "/banks/wegagen.svg",
  },
  {
    id: "zemen",
    name: "Zemen Bank",
    short: "Zemen",
    color: "#7F1D1D",
    accent: "#FEF2F2",
    logoUrl: "/banks/zemen.svg",
  },
  {
    id: "bunna",
    name: "Bunna International Bank",
    short: "Bunna",
    color: "#4A2C2A",
    accent: "#FAF7F5",
    logoUrl: "/banks/bunna.png",
  },
  {
    id: "berhan",
    name: "Berhan Bank",
    short: "Berhan",
    color: "#0B2545",
    accent: "#FFFBEB",
    logoUrl: "/banks/berhan.png",
  },
  {
    id: "abay",
    name: "Abay Bank",
    short: "Abay",
    color: "#1E40AF",
    accent: "#EFF6FF",
    logoUrl: "/banks/abay.png",
  },
  {
    id: "addis",
    name: "Addis International Bank",
    short: "Addis",
    color: "#6D28D9",
    accent: "#FAF5FF",
    logoUrl: "/banks/addis.png",
  },
];

export function getBankById(id: string) {
  return ethiopianBanks.find((b) => b.id === id);
}
