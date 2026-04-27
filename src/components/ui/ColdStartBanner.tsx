export default function ColdStartBanner() {
  return (
    <div className="flex items-center gap-2.5 mx-6 mt-4 px-3.5 py-2.5 bg-yellow-50 border border-yellow-300 rounded text-[13px] text-yellow-800 animate-fade-in">
      <div className="w-4 h-4 border-2 border-yellow-300 border-t-yellow-600 rounded-full animate-spin flex-shrink-0" />
      <span>
        Waking up the server — this may take up to 30 seconds on first load.
      </span>
    </div>
  );
}
