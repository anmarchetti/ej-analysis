import React, { FunctionComponent } from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { getMinutesLocalized } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Callout from 'frontend/components/common/Callout/Callout';

import styles from './TransferDurationPromo.module.scss';

export interface ITransferDurationPromoProps {
    timeDiff: number;
    className?: string;
    siteCoreValue?: string;
}

const TransferDurationPromo: FunctionComponent<ITransferDurationPromoProps> = ({
    className,
    timeDiff,
    siteCoreValue,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (timeDiff <= 0) {
        return null;
    }

    // If an override siteCore field value is provided, use that instead of the default
    const title = Tokenizer.replaceToken(
        siteCoreValue ?? getPhrase(SitecoreDictionary.TransferLabelsDurationPromoTitle),
        Tokens.Duration,
        getMinutesLocalized(timeDiff, getPhrase),
    );

    return (
        <div className={classNames(styles.promo, className)} data-tid='transfer-duration-value'>
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
