import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-20 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
        🤔
      </div>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">
        Contractor not found
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        We couldn&apos;t find a contractor with that license number.
      </p>
      <Link href="/search" className="btn-primary mt-6 inline-flex">
        Back to search
      </Link>
    </div>
  );
}
