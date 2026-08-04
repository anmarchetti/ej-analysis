import { RefObject, useEffect } from 'react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';

//INS-1434: Prevents unwanted scroll event after blur on iOS
export const useBodyScrollLockViaBlur = ({
    mobileInputRef,
    setIsBodyScrollLockedViaBlur,
}: {
    mobileInputRef: RefObject<HTMLElement>;
    setIsBodyScrollLockedViaBlur: (value: boolean) => void;
}): void => {
    const isMobile = useMobileViewport();

    useEffect(() => {
        const searchInput = mobileInputRef?.current;
        const lockBodyScrollAfterBlur = (): void => {
            if (isMobile) {
                setIsBodyScrollLockedViaBlur(true);
                setTimeout(() => setIsBodyScrollLockedViaBlur(false), 0);
            }
        };

        if (searchInput) {
            searchInput.addEventListener('blur', lockBodyScrollAfterBlur);
        }

        return () => {
            if (searchInput) {
                searchInput.removeEventListener('blur', lockBodyScrollAfterBlur);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile, mobileInputRef?.current, setIsBodyScrollLockedViaBlur]);
};
