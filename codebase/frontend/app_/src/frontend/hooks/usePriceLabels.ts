import { useMemo } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

interface IPriceLabels {
    labelAfterPrice: string;
    labelBeforePrice: string;
}

/**
 * Hook for getting labels before and after price from dictionary
 */
const usePriceLabels = (priceDictionary: SitecoreDictionary | undefined): IPriceLabels => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return useMemo(() => {
        const template = priceDictionary ? getPhrase(priceDictionary) : '';
        const [labelBeforePrice, labelAfterPrice] = template.split(Tokens.Price) as string[];

        return { labelBeforePrice, labelAfterPrice };
    }, [priceDictionary]);
};

export default usePriceLabels;
