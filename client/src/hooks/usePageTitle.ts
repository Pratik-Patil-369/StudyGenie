import { useEffect } from 'react';

const APP_NAME = 'StudyGenie';

/**
 * Sets the browser tab title.
 * Usage: usePageTitle('Topics') → "Topics | StudyGenie"
 */
export function usePageTitle(title: string) {
    useEffect(() => {
        const prev = document.title;
        document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
        return () => { document.title = prev; };
    }, [title]);
}
