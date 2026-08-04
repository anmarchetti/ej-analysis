import { FunctionComponent, useRef } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import SvgEcoCertified from 'frontend/components/icons-new/EcoCertified';

import Callout from './Callout/Callout';
import Pill from './Pills/Pill/Pill';

import styles from './EcoCertifiedPill.module.scss';

export interface IEcoCertifiedPillProps {
    title: string;
    className?: string;
    isNewPill?: boolean;
    tooltip?: string;
}

const EcoCertifiedPill: FunctionComponent<IEcoCertifiedPillProps> = ({
    title,
    tooltip,
    isNewPill,
    className,
}: IEcoCertifiedPillProps) => {
    const { trackEcoCertified, isDisabled } = useStore((stores: TStores) => ({
        trackEcoCertified: stores.trackingStore.trackEcoCertified,
        isDisabled: !stores.layoutStore.isEcoCertifiedEnabledOnSearchPage,
    }));

    const handleOnClick = (): void => {
        trackEcoCertified(EventTypes.EcoCertifiedIcon, 'click');
    };

    const handleOnMouseEnter = (): void => {
        trackEcoCertified(EventTypes.EcoCertifiedIcon, 'hover');
    };

    const ref = useRef(null);

    // global variable for enabling eco pill
    if (isDisabled) return null;

    // Remove the old variant after migration to the new pill is completed
    if (isNewPill) {
        return (
            <Pill
                contentClass={classNames(styles.pill, className)}
                icon={<SvgEcoCertified />}
                title={title}
                text={tooltip}
                onClick={(): void => trackEcoCertified(EventTypes.EcoCertifiedIcon, 'click')}
                onMouseEnter={(): void => trackEcoCertified(EventTypes.EcoCertifiedIcon, 'hover')}
                dataTid='eco-certified-pill'
            />
        );
    }

    return (
        <div
            className={classNames('eco-certified', styles.container)}
            onClick={handleOnClick}
            onMouseEnter={handleOnMouseEnter}
        >
            <SvgEcoCertified />

            {tooltip && (
                <div ref={ref} className='eco-certified__callout_container'>
                    <Callout
                        content={<div className={styles.tooltipContent}>{tooltip}</div>}
                        orientation={CalloutOrientation.Top}
                        position={CalloutPosition.Right}
                        isShownOnHover
                        enablePrintMode
                    >
                        <p className='eco-certified__title'>{title}</p>
                    </Callout>
                </div>
            )}
        </div>
    );
};

export default EcoCertifiedPill;
