"use client";

import { createContext, useContext, useCallback, useRef, useState } from "react";

interface NotificationContextValue {
    notifyError: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
    notifyError: () => {},
});

export function useNotification() {
    return useContext(NotificationContext);
}

interface Toast {
    id: number;
    message: string;
    visible: boolean;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<Toast | null>(null);
    const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const idRef = useRef(0);

    const notifyError = useCallback((message: string) => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        const id = ++idRef.current;
        setToast({ id, message, visible: true });
        dismissTimer.current = setTimeout(() => {
            setToast((t) => (t?.id === id ? { ...t, visible: false } : t));
            setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 300);
        }, 30000);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifyError }}>
            {children}
            {toast && (
                <div
                    className={`fixed right-0 z-50 mx-6 flex items-start gap-3 px-4 py-3 bg-white border border-red-200 rounded shadow-xl max-w-sm transition-all duration-300 ${
                        toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    }`}
                    style={{ top: 60 }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="#dc2626"
                        className="flex-shrink-0 mt-0.5"
                    >
                        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#172b4d]">
                            API unavailable
                        </div>
                        <div className="text-[12px] text-[#5e6c84] mt-0.5">{toast.message}</div>
                    </div>
                    <button
                        onClick={() => setToast((t) => (t ? { ...t, visible: false } : null))}
                        className="text-[#97a0af] hover:text-[#5e6c84] text-sm flex-shrink-0 transition-colors"
                    >
                        ✕
                    </button>
                </div>
            )}
        </NotificationContext.Provider>
    );
}
