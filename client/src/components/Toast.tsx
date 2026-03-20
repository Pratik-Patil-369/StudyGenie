import { toast as sonnerToast } from 'sonner'

export { Toaster as ToastContainer } from 'sonner'

export interface Toast {
    id: number
    message: string
    type: 'success' | 'error' | 'info'
}

/**
 * Compatibility wrapper for the existing toast() function.
 * This allows us to keep the same API while using the modern sonner library.
 */
export function toast(message: string, type: Toast['type'] = 'success') {
    if (type === 'success') {
        sonnerToast.success(message)
    } else if (type === 'error') {
        sonnerToast.error(message)
    } else {
        sonnerToast(message)
    }
}
