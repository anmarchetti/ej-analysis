import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import PricePill from 'frontend/components/common/Pills/PricePill/PricePill';

interface IFreeForeKidsPillProps {
    countryCode?: string;
    isSmall?: boolean;
    tooltipMessage?: string;
}

export const FreeForKidsPill: FC<IFreeForeKidsPillProps> = ({ isSmall, tooltipMessage, countryCode = '' }) => {
    const { getPhrase, isPillVisible } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isPillVisible: stores.layoutStore.isPillVisible,
    }));

    if (!isPillVisible(SiteSettings.FreeForKidsPill, countryCode)) {
        return null;
    }

    return (
        <PricePill isYellow isSmall={isSmall} tooltipMessage={tooltipMessage} className='free-for-kids-pill'>
            {getPhrase(SitecoreDictionary.BasketLabelFreeForKids)}
        </PricePill>
    );
};

export default observer(FreeForKidsPill);
