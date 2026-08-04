import { useEffect } from 'react';

import { BaseLayoutStore } from 'frontend/store/base/layout/BaseLayoutStore';
import { BaseSearchFilterStore } from 'frontend/store/base/search/BaseSearchFilterStore';
import { BaseSearchStore } from 'frontend/store/base/search/BaseSearchStore';

export interface IUseClearOnUnmountProps {
    clearFilterStoreValues: BaseSearchFilterStore['clearFilterStoreValues'];
    clearOldSearchParam: BaseSearchStore['clearOldSearchParam'];
    clearSearchValues: BaseSearchStore['clearSearchValues'];
    isDestinationPage: BaseLayoutStore['isDestinationPage'];
    shouldSkipEffect: boolean;
}

const useClearOnUnmount = ({
    isDestinationPage,
    clearOldSearchParam,
    clearSearchValues,
    clearFilterStoreValues,
    shouldSkipEffect,
}: IUseClearOnUnmountProps): void => {
    useEffect(() => {
        if (shouldSkipEffect) return;

        return () => {
            clearOldSearchParam();

            if (isDestinationPage) {
                clearSearchValues(true);
                clearFilterStoreValues();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};

export default useClearOnUnmount;
