import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const TARGET_DIR = path.resolve(process.cwd(), "public/banks");
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Map of bank ID to official scraped logo URLs
const bankSources = [
  {
    id: "cbe",
    ext: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/commercial_bank_of_ethiopia/commercial_bank_of_ethiopia.svg",
      "https://ethiopianlogos.com/logos/commercial_bank_of_ethiopia/commercial_bank_of_ethiopia.png",
    ],
  },
  {
    id: "awash",
    ext: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/awash_international_bank/awash_international_bank.svg",
      "https://awashbank.com/wp-content/uploads/2022/08/Fav-icon.svg",
      "https://ethiopianlogos.com/logos/awash_international_bank/awash_international_bank.png",
    ],
  },
  {
    id: "dashen",
    ext: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/dashen_bank/dashen_bank.svg",
      "https://ethiopianlogos.com/logos/dashen_bank/dashen_bank.png",
      "https://upload.wikimedia.org/wikipedia/commons/3/33/Dashen_Bank.png",
    ],
  },
  {
    id: "abyssinia",
    ext: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/bank_of_abyssinia/bank_of_abyssinia.svg",
      "https://ethiopianlogos.com/logos/bank_of_abyssinia/bank_of_abyssinia.png",
      "https://upload.wikimedia.org/wikipedia/commons/3/36/BOA-LOGO.png",
    ],
  },
  {
    id: "united",
    ext: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/hibret_bank/hibret_bank.svg",
      "https://ethiopianlogos.com/logos/hibret_bank/hibret_bank.png",
    ],
  },
  {
    id: "nib",
    ext: "png",
    urls: [
      "https://www.nibbanksc.com/wp-content/uploads/2022/03/LOGO-SETS-AND-STYLE-01.png",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Nib_International_Bank.png/320px-Nib_International_Bank.png",
    ],
  },
  {
    id: "cbo",
    ext: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/cooperative_bank_of_oromia/cooperative_bank_of_oromia.svg",
      "https://ethiopianlogos.com/logos/cooperative_bank_of_oromia/Cooperative_Bank_of_Oromia.png",
    ],
  },
  {
    id: "oromia",
    ext: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/oromia_international_bank/oromia_international_bank.svg",
      "https://ethiopianlogos.com/logos/oromia_international_bank/oromia_international_bank.png",
    ],
  },
  {
    id: "lion",
    ext: "png",
    urls: [
      "https://upload.wikimedia.org/wikipedia/en/b/be/Lion_International_Bank.png",
      "https://upload.wikimedia.org/wikipedia/en/thumb/b/be/Lion_International_Bank.png/300px-Lion_International_Bank.png",
    ],
  },
  {
    id: "wegagen",
    ext: "png",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/ca/Wogagen_Bank.png",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Wogagen_Bank.png/320px-Wogagen_Bank.png",
    ],
  },
  {
    id: "zemen",
    ext: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/zemen_bank/zemen_bank.svg",
      "https://ethiopianlogos.com/logos/zemen_bank/zemen_bank.png",
    ],
  },
  {
    id: "bunna",
    ext: "png",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/3/3e/Bunna_bank.png",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Bunna_bank.png/320px-Bunna_bank.png",
    ],
  },
  {
    id: "berhan",
    ext: "png",
    urls: [
      "https://upload.wikimedia.org/wikipedia/en/f/f4/Berhan_Bank.png",
      "https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Berhan_Bank.png/320px-Berhan_Bank.png",
    ],
  },
  {
    id: "abay",
    ext: "png",
    urls: [
      "https://upload.wikimedia.org/wikipedia/en/f/ff/Abay_Bank_logo.png",
      "https://upload.wikimedia.org/wikipedia/en/thumb/f/ff/Abay_Bank_logo.png/320px-Abay_Bank_logo.png",
    ],
  },
  {
    id: "addis",
    ext: "png",
    urls: [
      "https://upload.wikimedia.org/wikipedia/en/0/06/Addis_International_Bank.png",
      "https://upload.wikimedia.org/wikipedia/en/thumb/0/06/Addis_International_Bank.png/250px-Addis_International_Bank.png",
    ],
  },
  {
    id: "telebirr",
    ext: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/tele_birr/tele_birr.svg",
      "https://ethiopianlogos.com/logos/tele_birr/tele_birr.png",
    ],
  },
];

console.log("Starting official Ethiopian bank logos download into public/banks/...");

const results = [];

for (const bank of bankSources) {
  let downloaded = false;
  for (const url of bank.urls) {
    const ext = url.endsWith(".png") ? "png" : "svg";
    const outFile = path.join(TARGET_DIR, `${bank.id}.${ext}`);
    try {
      console.log(`Fetching ${bank.id} from ${url}...`);
      execSync(`curl.exe -s -L -f -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "${url}" -o "${outFile}"`, {
        timeout: 15000,
      });
      if (fs.existsSync(outFile) && fs.statSync(outFile).size > 500) {
        console.log(`✓ ${bank.id} saved (${fs.statSync(outFile).size} bytes) -> ${path.basename(outFile)}`);
        downloaded = true;
        results.push({ id: bank.id, file: path.basename(outFile), size: fs.statSync(outFile).size });
        break;
      }
    } catch (err) {
      console.warn(`  Failed from ${url}, trying fallback...`);
    }
  }
  if (!downloaded) {
    console.error(`✗ Could not download logo for ${bank.id}`);
  }
}

console.log("\nSummary of downloaded official bank logos:");
console.table(results);
