import React from 'react';
import CountUp from 'react-countup';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { NumberFormatPartTypes } from 'frontend/store/base';
import { TStores } from 'frontend/store/IStores';

import { addLeadingZero } from './BasketPriceCellPrice.utils';

export interface IBasketPriceCellPriceProps {
    amount: number;
    fractionPart: number;
    integerPart: number;
    prevFractionPart: number;
    prevIntegerPart: number;
}

export const BasketPriceCellPrice = ({
    amount,
    integerPart,
    fractionPart,
    prevIntegerPart,
    prevFractionPart,
}: IBasketPriceCellPriceProps) => {
    const {
        isClickChangeButton,
        disableBasketAnimation,
        currency,
        getFormattingSymbol,
        formatMoneyToIntegerAndDecimalWithTypes,
    } = useStore((stores: TStores) => ({
        isClickChangeButton: stores.bookingStore.isClickChangeButton,
        disableBasketAnimation: stores.bookingStore.disableBasketAnimation,
        currency: stores.bookingStore.currency,
        getFormattingSymbol: stores.marketStore.getFormattingSymbol,
        formatMoneyToIntegerAndDecimalWithTypes: stores.marketStore.formatMoneyToIntegerAndDecimalWithTypes,
    }));

    const priceCountUpAnimationDuration = 1.2;

    const renderStaticPrice = () => {
        const priceParts = formatMoneyToIntegerAndDecimalWithTypes(amount, {
            currency: currency,
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });

        return (
            <div>
                {priceParts.map(part =>
                    part.type === NumberFormatPartTypes.Decimal ? (
                        <span key={part.type} data-tid='decimal-part'>
                            {part.value}
                        </span>
                    ) : (
                        <span key={part.type} className='basket__price__whole' data-tid='whole-price-basket'>
                            {part.value}
                        </span>
                    ),
                )}
            </div>
        );
    };

    const renderCurrency = (currencySymbol: string) => (
        <span className='currency-symbol' data-tid='currency-symbol'>
            {currencySymbol}
        </span>
    );

    const renderAnimatedPrice = () => {
        const priceParts = formatMoneyToIntegerAndDecimalWithTypes(amount, { currency: currency });
        const isCurrencySymbolFirst = priceParts[0].type === NumberFormatPartTypes.Currency;

        const currencySymbol =
            priceParts.find(pricePart => pricePart.type === NumberFormatPartTypes.Currency)?.value || '';
        const thousandSeparator = getFormattingSymbol(NumberFormatPartTypes.Group, currency);
        const decimalSeparator = getFormattingSymbol(NumberFormatPartTypes.Decimal, currency);

        return (
            <>
                {isCurrencySymbolFirst && renderCurrency(currencySymbol)}
                <CountUp
                    className='basket__price__whole'
                    end={integerPart}
                    start={prevIntegerPart}
                    duration={priceCountUpAnimationDuration}
                    useEasing
                    preserveValue
                    separator={thousandSeparator}
                    decimals={0}
                />
                {fractionPart !== prevFractionPart && (
                    <>
                        {decimalSeparator}
                        <CountUp
                            end={fractionPart}
                            start={prevFractionPart}
                            duration={priceCountUpAnimationDuration}
                            useEasing
                            preserveValue
                            formattingFn={addLeadingZero}
                            decimals={0}
                        />
                    </>
                )}
                {!isCurrencySymbolFirst && renderCurrency(currencySymbol)}
            </>
        );
    };

    return isClickChangeButton && !disableBasketAnimation ? renderAnimatedPrice() : renderStaticPrice();
};

export default observer(BasketPriceCellPrice);
