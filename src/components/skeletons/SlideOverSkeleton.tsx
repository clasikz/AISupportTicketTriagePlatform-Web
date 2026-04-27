function Skel({ className }: { className: string }) {
    return (
        <div
            className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`}
        />
    );
}

export default function SlideOverSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <div className="px-5 py-4 border-b border-[#f4f5f7]">
                <Skel className="w-3/4 h-4 mb-2" />
                <Skel className="w-1/2 h-4 mb-4" />
                <Skel className="w-full h-9 rounded" />
            </div>

            <div className="px-5 py-4 border-b border-[#f4f5f7]">
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i}>
                            <Skel className="w-14 h-2.5 mb-1.5" />
                            <Skel className="w-20 h-5 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-5 py-4 border-b border-[#f4f5f7]">
                <Skel className="w-20 h-2.5 mb-3" />
                <Skel className="w-full h-3 mb-2" />
                <Skel className="w-full h-3 mb-2" />
                <Skel className="w-3/4 h-3" />
            </div>

            <div className="px-5 py-4">
                <div className="flex gap-4 mb-4">
                    <Skel className="w-24 h-3" />
                    <Skel className="w-16 h-3" />
                </div>
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex gap-2.5 mb-4">
                        <Skel className="w-7 h-7 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                            <Skel className="w-32 h-2.5 mb-1.5" />
                            <Skel className="w-full h-3 mb-1" />
                            <Skel className="w-2/3 h-3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
