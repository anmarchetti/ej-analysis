import React from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { getMinutesLocalized } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Callout from 'frontend/components/common/Callout/Callout';

const TransferDurationPromo = ({ timeDiff, sitecoreValue }: { timeDiff: number; sitecoreValue?: string }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (timeDiff <= 0) {
        return null;
    }

    // If an override sitecore field value is provided, use that instead of the default
    const title = Tokenizer.replaceToken(
        sitecoreValue || getPhrase(SitecoreDictionary.TransferLabelsDurationPromoTitle),
        Tokens.Duration,
        getMinutesLocalized(timeDiff, getPhrase),
    );

    return (
        <div className='transfer-promo'>
            <span>{title}</span>
            <Callout
                content={<div>{getPhrase(SitecoreDictionary.TransferLabelsDurationPromoTooltip)}</div>}
                orientation={CalloutOrientation.Top}
                position={CalloutPosition.Center}
                isShownOnHover
            />
        </div>
    );
};

export default TransferDurationPromo;
