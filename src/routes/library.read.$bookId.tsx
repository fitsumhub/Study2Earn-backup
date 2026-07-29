import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";

import { PageLoader } from "@/components/page-loader";
import { useLibraryProgress } from "@/hooks/use-library-progress";
import { libraryBooks } from "@/lib/mock-data";

const BookPdfViewer = lazy(() =>
  import("@/components/book-pdf-viewer").then((m) => ({ default: m.BookPdfViewer })),
);

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
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 bg-[#f3f4f8]">
            <PageLoader label="Preparing your reader…" fullScreen />
          </div>
        }
      >
        <BookPdfViewer book={book} onClose={() => navigate({ to: "/library" })} />
      </Suspense>
    </div>
  );
}
