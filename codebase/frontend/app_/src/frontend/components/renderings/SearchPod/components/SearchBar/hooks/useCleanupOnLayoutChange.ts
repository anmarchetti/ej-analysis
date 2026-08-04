import { useEffect } from 'react';

import usePrevious from 'frontend/hooks/usePrevious';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';

export const useCleanupOnLayoutChange = ({
    layoutId,
    selectedDropdown,
    changeSelectedDropdown,
    clearErrorMessage,
}: {
    changeSelectedDropdown: (field: SearchBarDropdown | null) => void;
    clearErrorMessage: () => void;
    layoutId: string;
    selectedDropdown: SearchBarDropdown | null;
}): void => {
    const prevLayoutId = usePrevious(layoutId);

    useEffect(() => {
        if (prevLayoutId && layoutId !== prevLayoutId) {
            if (selectedDropdown) {
                changeSelectedDropdown(null);
            }

            clearErrorMessage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutId]);
};
