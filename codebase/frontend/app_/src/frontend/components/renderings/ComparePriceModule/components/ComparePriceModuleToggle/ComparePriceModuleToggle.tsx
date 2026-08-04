import { FC, useCallback } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import Checkbox from 'frontend/components/common/Checkbox';
import styles from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceContent/ComparePriceContent.module.scss';

export interface IComparePriceModuleToggleProps {
    cheapestRoomLabel: string;
    isEnabled: boolean;
    keepRoomLabel: string;
    onReload: () => Promise<void>;
    selectedDate: Date;
    setActiveDate: (date: Date) => void;
    hasTouristTaxLabel?: boolean;
    isGraphView?: boolean;
}

export const ComparePriceModuleToggle: FC<IComparePriceModuleToggleProps> = ({
    keepRoomLabel,
    cheapestRoomLabel,
    isEnabled,
    onReload,
    selectedDate,
    setActiveDate,
    isGraphView,
    hasTouristTaxLabel,
}) => {
    const { isCheapest, setIsCheapest, resetToInitialComparePricesCalendar, clearAlternativeOffers } = useStore(
        (stores: TStores) => ({
            isCheapest: stores.layoutStore.isCheapestComparePriceOption,
            setIsCheapest: stores.layoutStore.setIsCheapestComparePriceOption,
            resetToInitialComparePricesCalendar: stores.comparePricesCalendarStore.resetToInitial,
            clearAlternativeOffers: stores.priceGraphStore.clearAlternativeOffers,
        }),
    );

    const handleToggleClick = useCallback(async (): Promise<void> => {
        const newState = !isCheapest;

        setActiveDate(selectedDate);

        resetToInitialComparePricesCalendar();
        clearAlternativeOffers();

        setIsCheapest(newState);

        await onReload();
    }, [
        isCheapest,
        selectedDate,
        setActiveDate,
        resetToInitialComparePricesCalendar,
        clearAlternativeOffers,
        setIsCheapest,
        onReload,
    ]);

    if (!isEnabled) {
        return null;
    }

    return (
        <div
            className={classNames(styles.toggleWrapper, {
                [styles.toggleWrapperGraph]: isGraphView,
                [styles.toggleWithoutTax]: !hasTouristTaxLabel,
            })}
            data-tid='compare-price-module-toggle'
        >
            <Checkbox
                toggle
                onChange={handleToggleClick}
                label={keepRoomLabel}
                label2={cheapestRoomLabel}
                checked={!isCheapest}
            />
        </div>
    );
};

export default ComparePriceModuleToggle;
