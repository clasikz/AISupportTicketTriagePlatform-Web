import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
    title: "TT Desk — AI Support Platform",
    description: "AI-powered support ticket triage platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="antialiased">
                <NotificationProvider>
                    <AuthProvider>
                        <AppShell>{children}</AppShell>
                    </AuthProvider>
                </NotificationProvider>
            </body>
        </html>
    );
}
