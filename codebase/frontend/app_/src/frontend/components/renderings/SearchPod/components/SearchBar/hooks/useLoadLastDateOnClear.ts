import { useEffect } from 'react';

import usePrevious from 'frontend/hooks/usePrevious';
import { IDisplayValue } from 'models/data/IDisplayValue';

/**EJH-15269 load last date if after clearing FROM or TO fields both of them became empty.
 * Need to load as last date from previous availability interval could be less than last date from route file **/
export const useLoadLastDateOnClear = ({
    selectedDestinationCodes,
    originsDisplayValue,
    loadLastAvailableDate,
}: {
    loadLastAvailableDate: () => Promise<void>;
    originsDisplayValue: IDisplayValue;
    selectedDestinationCodes: string[];
}): void => {
    const prevSelectedDestinationCodes = usePrevious(selectedDestinationCodes);
    const prevOriginsDisplayValue = usePrevious(originsDisplayValue);

    useEffect(() => {
        const isPrevDestEmpty = !prevSelectedDestinationCodes?.length;
        const isCurrDestEmpty = !selectedDestinationCodes?.length;
        const isPrevOriginsEmpty = prevOriginsDisplayValue?.main === '';
        const isCurrOriginsEmpty = originsDisplayValue.main === '';

        const fromCleared = !isPrevDestEmpty && isCurrDestEmpty && isCurrOriginsEmpty;
        const toCleared = !isPrevOriginsEmpty && isCurrOriginsEmpty && isCurrDestEmpty;

        if (fromCleared || toCleared) {
            loadLastAvailableDate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDestinationCodes, originsDisplayValue.main]);
};
