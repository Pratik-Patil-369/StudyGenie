import { GraduationCap } from 'lucide-react'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="border-t bg-card/50 mt-auto">
            <div className="px-4 md:px-6 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                            <GraduationCap className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                        <span className="text-sm font-semibold">StudyGenie</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        &copy; {currentYear} StudyGenie. Developed for Infosys Springboard Internship 2025.
                    </p>
                </div>
            </div>
        </footer>
    )
}
