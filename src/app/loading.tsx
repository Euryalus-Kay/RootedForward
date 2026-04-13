export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        <p className="mt-4 font-body text-sm text-warm-gray">Loading...</p>
      </div>
    </div>
  );
}
