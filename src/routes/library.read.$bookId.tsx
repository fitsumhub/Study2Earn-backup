import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { BookPdfViewer } from "@/components/book-pdf-viewer";
import { useLibraryProgress } from "@/hooks/use-library-progress";
import { libraryBooks } from "@/lib/mock-data";

export const Route = createFileRoute("/library/read/$bookId")({
  head: () => ({
    meta: [{ title: `Reading — Study2Earn` }],
  }),
  component: LibraryReadPage,
});

function LibraryReadPage() {
  const { bookId } = Route.useParams();
  const navigate = useNavigate();
  const { books } = useLibraryProgress();

  const book =
    books.find((b) => b.id === bookId) ?? libraryBooks.find((b) => b.id === bookId) ?? null;

  useEffect(() => {
    if (book) document.title = `${book.name} — Study2Earn`;
  }, [book]);

  if (!book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
        <p className="font-serif text-xl font-bold text-white">Book not found</p>
        <Link to="/library" className="mt-4 text-sm font-semibold text-brand-gold underline">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <BookPdfViewer book={book} onClose={() => navigate({ to: "/library" })} />
    </div>
  );
}
