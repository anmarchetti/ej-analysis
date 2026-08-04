import { useEffect } from 'react';

import { prepareBodyScrollLock } from 'frontend/utils/ui.utils';

export const useCleanupOnMount = ({ clearErrorMessage }: { clearErrorMessage: () => void }): void => {
    useEffect(() => {
        clearErrorMessage();
        prepareBodyScrollLock();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
