import * as React from 'react';

import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import PricePill from 'frontend/components/common/Pills/PricePill/PricePill';

interface IFreeNightsPillProps {
    nights: number;
}

export const FreeNightsIncludedPill = ({ nights }: IFreeNightsPillProps) => {
    const { getPhrase, getSetting, isFreeNightsEnabled } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        isFreeNightsEnabled: stores.layoutStore.isFreeNightsEnabled,
    }));

    if (!isFreeNightsEnabled || nights < 1) {
        return null;
    }

    const icon = cmsUrls.media(getSetting(SiteSettings.FreeNightsIcon));
    const label = Tokenizer.replaceToken(
        getPhrase(
            nights > 1
                ? SitecoreDictionary.FreeUpgradesLabelsFreeNightsIncludedPlural
                : SitecoreDictionary.FreeUpgradesLabelsFreeNightIncludedSingular,
        ),
        Tokens.Number,
        `${nights}`,
    );

    return (
        <PricePill
            className='free-nights-pill'
            tooltipMessage={getPhrase(SitecoreDictionary.FreeUpgradesLabelsFreeNightsIncludedTooltip)}
            isTooltipOnRight
        >
            {!!icon && <span className='icon--bg-image' style={{ backgroundImage: `url(${icon})` }} />}
            {label}
        </PricePill>
    );
};

export default FreeNightsIncludedPill;
