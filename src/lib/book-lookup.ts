import { libraryBooks } from "@/lib/mock-data";

export function getBookIdByShort(short: string): string | undefined {
  return libraryBooks.find((b) => b.short === short)?.id;
}

export function getBookIdByName(name: string): string | undefined {
  return libraryBooks.find((b) => b.name === name)?.id;
}
