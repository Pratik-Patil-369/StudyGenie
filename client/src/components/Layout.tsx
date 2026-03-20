import { useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import AIChatWidget from './AIChatWidget'
import Footer from './Footer'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
                <Sidebar />
            </aside>

            {/* Mobile sidebar (Sheet) */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-64 p-0">
                    <VisuallyHidden><SheetTitle>Navigation Menu</SheetTitle></VisuallyHidden>
                    <Sidebar onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Main content */}
            <div className="flex flex-1 flex-col md:pl-64">
                <TopBar onMenuClick={() => setMobileOpen(true)} />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
                <Footer />
            </div>

            <AIChatWidget />
        </div>
    )
}
