import React, { FC } from 'react';
import classNames from 'classnames';

import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import styles from 'frontend/components/renderings/ViewBooking/HolidayCost/HolidayCost.module.scss';

interface IPriceBreakdownProps {
    currency: CurrencyCode | undefined;
    priceBreakdown: IPriceBreakdownItem[];
    rowClassName?: string;
}

const PriceBreakdown: FC<IPriceBreakdownProps> = ({ priceBreakdown, currency, rowClassName }) => {
    const { getPhrase, formatMoney } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
    }));

    return (
        <>
            {priceBreakdown.map(item => (
                <div
                    key={item.name}
                    data-tid='price-breakdown-item'
                    className={classNames(styles.tableRow, rowClassName)}
                >
                    <span>{item.name}</span>
                    <span
                        className={classNames('price', { [styles.priceNegative]: item.amount < 0 })}
                        data-cs-mask
                        data-tid='price-breakdown-price'
                    >
                        {item.code === PriceBreakdownCode.Kids
                            ? getPhrase(SitecoreDictionary.BoardTypesButtonsIncluded)
                            : formatMoney(item.amount, {
                                  currency,
                                  trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                              })}
                    </span>
                </div>
            ))}
        </>
    );
};

export default PriceBreakdown;
