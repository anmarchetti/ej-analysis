import { FC, ReactElement } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PriceGraph from 'frontend/components/common/PriceGraph';
import SvgPriceGraph from 'frontend/components/icons-new/PriceGraph';
import styles from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceContent/ComparePriceContent.module.scss';
import ComparePriceModuleToggle, {
    IComparePriceModuleToggleProps,
} from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceModuleToggle/ComparePriceModuleToggle';
import ComparePriceTouristTax from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceTouristTax/ComparePriceTouristTax';

export const PriceGraphTabTitle: FC = (): ReactElement => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className={styles.titleWrapper}>
            <SvgPriceGraph />
            <span>{getPhrase(SitecoreDictionary.ComparePriceModuleGraphView)}</span>
        </div>
    );
};

export interface IPriceGraphTabContentProps {
    changeActiveDate: (d: Date) => void;
    holidayDurationLabel: string;
    isDisplayed: boolean;
    middleDate: Date;
    selectedDate: Date;
    toggleProps: IComparePriceModuleToggleProps;
    touristTaxLabel?: string;
}

export const PriceGraphTabContent: FC<IPriceGraphTabContentProps> = ({
    holidayDurationLabel,
    isDisplayed,
    touristTaxLabel,
    toggleProps,
    ...props
}): ReactElement => (
    <div className={styles.contentWrapper}>
        <div className={styles.header}>
            <p className={styles.duration}>{holidayDurationLabel}</p>
        </div>
        <ComparePriceTouristTax label={touristTaxLabel} isPriceGraphView />

        <ComparePriceModuleToggle {...toggleProps} isGraphView />

        {isDisplayed ? (
            <div className={styles.priceGraphWrapper}>
                <PriceGraph {...props} />
            </div>
        ) : null}
    </div>
);

export default PriceGraphTabContent;
