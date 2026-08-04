import { FC, ReactNode } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TouristTaxTooltip } from 'frontend/components/common/TouristTaxTooltip/TouristTaxTooltip';

import styles from './TouristTaxGenericTooltip.module.scss';

export interface ITouristTaxGenericTooltipProps {
    children: ReactNode;
    triggerClassName?: string;
}

export const TouristTaxGenericTooltip: FC<ITouristTaxGenericTooltipProps> = ({ children, triggerClassName }) => {
    const { isTouristTaxEnabled, getPhrase } = useStore(stores => ({
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!isTouristTaxEnabled) {
        return <>{children}</>;
    }

    const tooltipText = getPhrase(SitecoreDictionary.TouristTaxTooltipsGenericContent);

    return (
        <TouristTaxTooltip
            tooltipText={tooltipText}
            triggerClassName={classNames(styles.trigger, triggerClassName)}
            dataId='tax-generic-tooltip-label'
        >
            {children}
        </TouristTaxTooltip>
    );
};
