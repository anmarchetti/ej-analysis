import React, { FunctionComponent } from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { getMinutesLocalized } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Callout from 'frontend/components/common/Callout/Callout';
import SvgAccessTime from 'frontend/components/icons-new/AccessTime';

import styles from './TransferDuration.module.scss';

export interface ITransferDurationProps {
    duration: number;
    className?: string;
    hideOnDesktop?: boolean;
    hideOnMobile?: boolean;
    iconClassName?: string;
}

const TransferDuration: FunctionComponent<ITransferDurationProps> = ({
    duration,
    className,
    iconClassName,
    hideOnDesktop,
    hideOnMobile,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (duration <= 0) {
        return null;
    }

    const title = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.TransferLabelsDurationTitle),
        Tokens.Duration,
        getMinutesLocalized(duration, getPhrase),
    );

    const transfersClassNames = classNames(
        className,
        styles.container,
        hideOnDesktop && styles.hideOnDesktop,
        hideOnMobile && styles.hideOnMobile,
    );

    return (
        <div className={transfersClassNames} data-tid='transfer-duration'>
            <SvgAccessTime className={iconClassName} />
            <span>{title}</span>
            <Callout
                content={<div>{getPhrase(SitecoreDictionary.TransferLabelsDurationTooltip)}</div>}
                orientation={CalloutOrientation.Top}
                position={CalloutPosition.Center}
                className={styles.callout}
                isShownOnHover
            />
        </div>
    );
};

export default TransferDuration;
