function Skel({ className }: { className: string }) {
    return (
        <div
            className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`}
        />
    );
}

export default function StatCardSkeleton() {
    return (
        <div className="bg-white border border-[#dfe1e6] rounded px-6 py-4">
            <div className="flex items-center justify-between">
                <Skel className="w-16 h-3" />
                <Skel className="w-10 h-10 rounded" />
            </div>
            <Skel className="w-12 h-7 mt-1" />
            <Skel className="w-24 h-2.5 mt-2" />
        </div>
    );
}
