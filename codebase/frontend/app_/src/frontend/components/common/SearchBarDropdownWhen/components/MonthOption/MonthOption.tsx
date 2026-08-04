import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IMonthItem } from 'models/data/IMonthAvailability';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import SvgTick from 'frontend/components/icons-new/Tick';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import MonthOptionOld from './MonthOptionOld/MonthOptionOld';

import styles from './MonthOption.module.scss';

export interface IMonthOptionProps {
    isVisible: boolean;
    month: IMonthItem;
    onMonthChange: (month: IMonthItem) => void;
}

const MonthOption: FC<IMonthOptionProps> = ({ month, isVisible, onMonthChange }) => {
    const { from, getPhrase, formatMoney, isCheapestMonthPriceEnabled, shouldShowCheapestMonthTotalPrice } = useStore(
        (stores: TStores) => ({
            from: stores.searchStore.searchWhen.from,
            getPhrase: stores.layoutStore.getPhrase,
            formatMoney: stores.marketStore.formatMoney,
            isCheapestMonthPriceEnabled: stores.layoutStore.isCheapestMonthPriceEnabled,
            shouldShowCheapestMonthTotalPrice: stores.layoutStore.shouldShowCheapestMonthTotalPrice,
        }),
    );

    const { fields: { CheapestMonthLabel, CheapestMonthUnavailableLabel, CheapestMonthIcon } = {} } =
        useSearchPodStore();

    const isAvailable = month.availability ?? false;
    const id = `${month.monthName}-${month.year}`;
    const isMonthSelected = month.date.isSame(dayjs(from), 'month');

    const cheapestPriceToShow = shouldShowCheapestMonthTotalPrice
        ? month.cheapestMonthPrice
        : month.cheapestMonthPricePP;
    const cheapestPriceDictionary = shouldShowCheapestMonthTotalPrice
        ? SitecoreDictionary.GlobalsPriceLabelsFrom
        : SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom;
    const cheapestPriceLabel = Tokenizer.replaceToken(
        getPhrase(cheapestPriceDictionary),
        Tokens.Price,
        formatMoney(cheapestPriceToShow, {
            roundUp: true,
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        }),
    );

    const shouldShowCheapestPrice = !!cheapestPriceToShow && isAvailable;

    if (!isCheapestMonthPriceEnabled) {
        return <MonthOptionOld isVisible={isVisible} month={month} onMonthChange={onMonthChange} />;
    }

    return (
        <div key={id} aria-hidden={!isVisible} className={styles.container} data-tid='month-option'>
            <input
                type='radio'
                name='month'
                value={id}
                disabled={!isAvailable}
                checked={isMonthSelected}
                onChange={(): void => onMonthChange(month)}
                aria-label={`${month.monthName} ${month.year}`}
                aria-checked={isMonthSelected}
                aria-disabled={!isAvailable}
                aria-hidden={!isVisible}
                id={id}
                className={styles.input}
                data-tid={`${id}-input`}
            />
            <label
                htmlFor={id}
                className={classNames(styles.monthLabel, {
                    [styles.disabledMonthLabel]: !isAvailable,
                    [styles.selectedMonthLabel]: isMonthSelected,
                    [styles.withCheapestMonth]: shouldShowCheapestPrice,
                })}
                data-tid={`${id}-label`}
            >
                <div className={styles.mainContent}>
                    <SvgTick className={styles.tickIcon} />

                    <span className={styles.year}>{month.year}</span>
                    <span className={styles.monthName}>{month.monthName}</span>

                    {shouldShowCheapestPrice && (
                        <span data-tid='cheapest-month-price' className={styles.cheapestPrice}>
                            {cheapestPriceLabel}
                        </span>
                    )}

                    {!isAvailable && (
                        <Text
                            field={CheapestMonthUnavailableLabel}
                            tag='span'
                            className={styles.unavailable}
                            data-tid='month-unavailable'
                        />
                    )}
                </div>

                {shouldShowCheapestPrice && (
                    <div className={styles.cheapestMonthRibbon} data-tid='cheapest-month'>
                        <div className={styles.ribbonIcon}>
                            <JSSImageNext field={CheapestMonthIcon} mediaSize={MediaSize.Small} fill />
                        </div>

                        <Text field={CheapestMonthLabel} tag='span' className={styles.cheapestMonthLabel} />
                    </div>
                )}
            </label>
        </div>
    );
};

export default observer(MonthOption);
