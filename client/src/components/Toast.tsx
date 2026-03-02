import { useEffect, useState } from 'react';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

let toastCounter = 0;
let globalAddToast: ((msg: string, type: Toast['type']) => void) | null = null;

export function toast(message: string, type: Toast['type'] = 'success') {
    if (globalAddToast) globalAddToast(message, type);
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        globalAddToast = (message, type) => {
            const id = ++toastCounter;
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        };
        return () => { globalAddToast = null; };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    <span className="toast-icon">
                        {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
                    </span>
                    {t.message}
                </div>
            ))}
        </div>
    );
}
