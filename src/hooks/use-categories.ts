import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_CATEGORIES,
  readCategories,
  slugifyCategory,
  subscribeCategories,
  writeCategories,
  type BookCategory,
  type CategoryColor,
} from "@/lib/category-store";

/**
 * Live-synced access to the library category list. Any component can read the
 * current categories and mutate them; changes persist to localStorage and
 * broadcast to every other subscriber (public library + admin console).
 */
export function useCategories() {
  const [categories, setCategories] = useState<BookCategory[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    setCategories(readCategories());
    return subscribeCategories(() => setCategories(readCategories()));
  }, []);

  const persist = useCallback((next: BookCategory[]) => {
    setCategories(next);
    writeCategories(next);
  }, []);

  const addCategory = useCallback(
    (input: { name: string; color: CategoryColor; description?: string }) => {
      const name = input.name.trim();
      if (!name) return { ok: false as const, error: "Name is required" };
      const current = readCategories();
      if (current.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        return { ok: false as const, error: "That category already exists" };
      }
      const category: BookCategory = {
        id: slugifyCategory(name),
        name,
        color: input.color,
        description: input.description?.trim() || undefined,
      };
      persist([...current, category]);
      return { ok: true as const, category };
    },
    [persist],
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<Omit<BookCategory, "id">>) => {
      const current = readCategories();
      const nextName = patch.name?.trim();
      if (
        nextName &&
        current.some((c) => c.id !== id && c.name.toLowerCase() === nextName.toLowerCase())
      ) {
        return { ok: false as const, error: "Another category already uses that name" };
      }
      persist(
        current.map((c) =>
          c.id === id
            ? {
                ...c,
                ...patch,
                name: nextName ?? c.name,
                description:
                  patch.description !== undefined
                    ? patch.description.trim() || undefined
                    : c.description,
              }
            : c,
        ),
      );
      return { ok: true as const };
    },
    [persist],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      persist(readCategories().filter((c) => c.id !== id));
    },
    [persist],
  );

  const resetToDefaults = useCallback(() => {
    persist(DEFAULT_CATEGORIES);
  }, [persist]);

  return {
    categories,
    categoryNames: categories.map((c) => c.name),
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDefaults,
  };
}
