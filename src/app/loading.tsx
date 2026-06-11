export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-forest/20 border-t-forest"
          aria-hidden="true"
        />
        <p className="ledger mt-5 text-warm-gray">Loading</p>
      </div>
    </div>
  );
}
