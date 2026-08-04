import { useCallback } from 'react';
import { useRouter } from 'next/router';

type TGoBack = (byBreadcrumbs?: boolean) => void;

export const useGoBack = (goBackToPreviousPage: TGoBack, byBreadcrumbs?: boolean): (() => void) => {
    const router = useRouter();

    return useCallback(() => {
        const isPreviousPageMicroApp = document.referrer?.includes('/manage');

        if (isPreviousPageMicroApp) {
            router.back();
        } else {
            goBackToPreviousPage(byBreadcrumbs);
        }
    }, [goBackToPreviousPage, byBreadcrumbs, router]);
};
