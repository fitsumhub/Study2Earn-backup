import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const TARGET_DIR = path.resolve(process.cwd(), "public/banks");
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Map of bank ID to official scraped logo URLs directly from official sites
const officialBankSources = [
  {
    id: "cbe",
    preferredExt: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/commercial_bank_of_ethiopia/commercial_bank_of_ethiopia.svg",
      "https://www.combanketh.et/images/logo and name transparent-%E1%88%86%E1%88%AA%E1%89%A6%E1%8A%90%E1%89%B3%E1%88%88.png"
    ]
  },
  {
    id: "awash",
    preferredExt: "svg",
    urls: [
      "https://awashbank.com/wp-content/uploads/2022/08/Awash-bank-logo.svg",
      "https://awashbank.com/wp-content/uploads/2022/08/Fav-icon.svg",
      "https://ethiopianlogos.com/logos/awash_international_bank/awash_international_bank.svg"
    ]
  },
  {
    id: "dashen",
    preferredExt: "png",
    urls: [
      "https://dashenbanksc.com/wp-content/uploads/Dashen-Bank-Logo-Addis-Ababa-Ethiopia.png",
      "https://ethiopianlogos.com/logos/dashen_bank/dashen_bank.svg"
    ]
  },
  {
    id: "abyssinia",
    preferredExt: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/bank_of_abyssinia/bank_of_abyssinia.svg",
      "https://www.bankofabyssinia.com/wp-content/uploads/2020/10/Asset-7@2x.png"
    ]
  },
  {
    id: "united",
    preferredExt: "svg",
    urls: [
      "https://hibretbank.com.et/wp-content/uploads/2021/06/hibret-logo.svg",
      "https://ethiopianlogos.com/logos/hibret_bank/hibret_bank.svg"
    ]
  },
  {
    id: "nib",
    preferredExt: "png",
    urls: [
      "https://www.nibbanksc.com/wp-content/uploads/2022/03/LOGO-SETS-AND-STYLE-01.png",
      "https://www.nibbanksc.com/wp-content/uploads/2022/06/1-02.png"
    ]
  },
  {
    id: "cbo",
    preferredExt: "svg",
    urls: [
      "https://coopbankoromia.com.et/wp-content/uploads/2020/11/Coopbank-Logo-Ethiopia.svg",
      "https://ethiopianlogos.com/logos/cooperative_bank_of_oromia/cooperative_bank_of_oromia.svg"
    ]
  },
  {
    id: "oromia",
    preferredExt: "svg",
    urls: [
      "https://ethiopianlogos.com/logos/oromia_international_bank/oromia_international_bank.svg",
      "https://upload.wikimedia.org/wikipedia/commons/e/e0/Oromia_Bank_Logo.png"
    ]
  },
  {
    id: "lion",
    preferredExt: "png",
    urls: [
      "https://anbesabank.com/wp-content/uploads/2026/01/Anbesa-Logo.png",
      "https://anbesabank.com/wp-content/uploads/2026/01/Main-Logo-scaled.png",
      "https://upload.wikimedia.org/wikipedia/en/b/be/Lion_International_Bank.png"
    ]
  },
  {
    id: "wegagen",
    preferredExt: "svg",
    urls: [
      "https://www.wegagen.com/assets/Logo-860ca6aa.svg",
      "https://upload.wikimedia.org/wikipedia/commons/c/ca/Wogagen_Bank.png"
    ]
  },
  {
    id: "zemen",
    preferredExt: "svg",
    urls: [
      "https://zemenbank.com/wp-content/uploads/2024/10/Group-6.svg",
      "https://ethiopianlogos.com/logos/zemen_bank/zemen_bank.svg"
    ]
  },
  {
    id: "bunna",
    preferredExt: "png",
    urls: [
      "https://bunnabanksc.com/wp-content/uploads/2023/06/logo-1-167x58.png",
      "https://bunnabanksc.com/wp-content/uploads/2023/06/cropped-logo-1-192x192.png",
      "https://upload.wikimedia.org/wikipedia/commons/3/3e/Bunna_bank.png"
    ]
  },
  {
    id: "berhan",
    preferredExt: "png",
    urls: [
      "https://berhanbanksc.com/wp-content/uploads/2022/06/logo-berhan-bank.png",
      "https://upload.wikimedia.org/wikipedia/en/f/f4/Berhan_Bank.png"
    ]
  },
  {
    id: "abay",
    preferredExt: "png",
    urls: [
      "https://www.abaybanksc.com/wp-content/uploads/2024/03/abayBank_logo3-01.png",
      "https://www.abaybanksc.com/wp-content/uploads/2020/08/abayBank_logo2-01-1.png",
      "https://upload.wikimedia.org/wikipedia/en/f/ff/Abay_Bank_logo.png"
    ]
  },
  {
    id: "addis",
    preferredExt: "png",
    urls: [
      "https://upload.wikimedia.org/wikipedia/en/0/06/Addis_International_Bank.png"
    ]
  },
  {
    id: "telebirr",
    preferredExt: "svg",
    urls: [
      "https://www.ethiotelecom.et/wp-content/uploads/2021/04/TeleBirr-Logo.svg",
      "https://ethiopianlogos.com/logos/tele_birr/tele_birr.svg"
    ]
  }
];

console.log("Scraping and downloading official logos from bank websites...");

const results = [];

for (const bank of officialBankSources) {
  let savedFile = null;
  for (const url of bank.urls) {
    const ext = url.toLowerCase().includes(".svg") ? "svg" : "png";
    const outFile = path.join(TARGET_DIR, `${bank.id}.${ext}`);
    try {
      console.log(`Downloading ${bank.id} from ${url}...`);
      execSync(`curl.exe -k -s -L -f -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "${url}" -o "${outFile}"`, {
        timeout: 20000,
      });
      if (fs.existsSync(outFile) && fs.statSync(outFile).size > 400) {
        const size = fs.statSync(outFile).size;
        console.log(`✓ ${bank.id} successfully saved as ${path.basename(outFile)} (${size} bytes)`);
        savedFile = path.basename(outFile);
        results.push({ id: bank.id, file: savedFile, size, source: url });
        break;
      }
    } catch (err) {
      console.warn(`  Failed from ${url}, trying next source...`);
    }
  }
  if (!savedFile) {
    console.error(`✗ Failed to download logo for ${bank.id}`);
  }
}

console.log("\nDownload Summary:");
console.table(results);
