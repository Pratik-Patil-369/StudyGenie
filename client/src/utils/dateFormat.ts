/**
 * Shared date formatting utility.
 * Centralises all date formatting so it's consistent across pages.
 */

export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions): string {
    const options: Intl.DateTimeFormatOptions = opts ?? {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    };
    return new Date(d).toLocaleDateString('en-US', options);
}

export function formatDateShort(d: string | Date): string {
    return formatDate(d, { month: 'short', day: 'numeric' });
}

export function formatDateRange(start: string | Date, end: string | Date): string {
    return `${formatDate(start)} – ${formatDate(end)}`;
}
