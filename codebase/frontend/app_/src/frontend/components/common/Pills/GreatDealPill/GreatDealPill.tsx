import * as React from 'react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PricePill from 'frontend/components/common/Pills/PricePill/PricePill';

interface IGreatDealPillProps {
    hideTooltip?: boolean;
}

export const GreatDealPill = ({ hideTooltip }: IGreatDealPillProps) => {
    const { getPhrase, isGreatDealPillEnabled } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isGreatDealPillEnabled: stores.layoutStore.isGreatDealPillEnabled,
    }));

    if (!isGreatDealPillEnabled) {
        return null;
    }

    return (
        <PricePill
            isRed
            className='great-deal-pill'
            tooltipMessage={
                hideTooltip ? undefined : getPhrase(SitecoreDictionary.HolidayCardLabelsGreatDealPillTooltip)
            }
        >
            <span>{getPhrase(SitecoreDictionary.HolidayCardLabelsGreatDealPill)}</span>
        </PricePill>
    );
};

export default GreatDealPill;
