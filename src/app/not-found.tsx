import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-white text-center select-none">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-600/20 border border-orange-500/30 text-orange-500 font-black text-2xl flex items-center justify-center mx-auto">
          404
        </div>
        <h1 className="text-2xl font-black tracking-tight">Page Not Found</h1>
        <p className="text-xs text-zinc-400">
          The terminal page you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Link
            href="/pos"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition shadow-md"
          >
            Return to POS Terminal
          </Link>
        </div>
      </div>
    </div>
  );
}
