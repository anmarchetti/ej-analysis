import { FunctionComponent, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import StickyBox from 'frontend/components/common/StickyBox';

import FlightsBasket from './components/FlightsBasket/FlightsBasket';
import TransfersBasket from './components/TransfersBasket/TransfersBasket';

interface IAmendmentBasketInfo {
    mainContent: JSX.Element | string;
    price: number;
    pricePP: number;
}

export const AmendmentBasket: FunctionComponent = () => {
    const basketRef = useRef<HTMLDivElement>(null);

    const {
        getPhrase,
        isAmendFlightsPage,
        isAmendTransfersPage,
        selectedFlight,
        selectedTransfer,
        currency,
        handleSubmitBasket,
        formatMoney,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isAmendFlightsPage: stores.layoutStore.isAmendFlightsPage,
        isAmendTransfersPage: stores.layoutStore.isAmendTransfersPage,
        selectedFlight: stores.amendFlightsStore.selectedFlight,
        selectedTransfer: stores.amendTransfersStore.selectedTransfer,
        currency: stores.viewBookingStore.booking?.currency?.code,
        // Fallback for TradePortalStore
        handleSubmitBasket: stores.viewBookingStore.handleSubmitBasket || stores.viewBookingStore.continueToPay,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const isMobile = useMobileViewport();

    const basketInfo = useMemo<Nullable<IAmendmentBasketInfo>>(() => {
        if (isAmendFlightsPage) {
            const price = selectedFlight?.amendmentCharges ?? 0;

            return {
                mainContent: <FlightsBasket />,
                price: price,
                pricePP: price,
            };
        }

        if (isAmendTransfersPage && selectedTransfer) {
            return {
                mainContent: <TransfersBasket transfer={selectedTransfer.transfer} />,
                price: selectedTransfer?.amendmentCharges || 0,
                pricePP: selectedTransfer?.amendmentCharges || 0,
            };
        }

        return null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFlight, selectedTransfer]);

    if (isMobile) {
        return null;
    }

    if (!basketInfo) {
        return null;
    }

    const hidePrice = isAmendFlightsPage && !selectedFlight;
    const hideButton = isAmendFlightsPage && !selectedFlight;
    const isPriceExists = typeof basketInfo.price === 'number';
    const priceLabel = formatMoney(getAmendmentRoundedPrice(basketInfo.price), {
        currency,
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        maximumFractionDigits: 0,
    });
    const pricePPLabel = formatMoney(getAmendmentRoundedPrice(basketInfo.pricePP), {
        currency,
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        maximumFractionDigits: 0,
    });

    return (
        <StickyBox
            render={() => (
                <div className={classNames('amendment-basket')} ref={basketRef}>
                    <div className='wrapper-component-container__inner'>
                        <div className='amendment-basket__cell amendment-basket__cell--main'>
                            {basketInfo.mainContent}
                        </div>

                        {!hidePrice && isPriceExists && (
                            <div className='amendment-basket__cell amendment-basket__cell--diagonal'>
                                <div className='amendment-basket__cell-inner'>
                                    <PriceLabel
                                        tag='div'
                                        className='amendment-basket__price'
                                        price={<span className='value'>{priceLabel}</span>}
                                        priceDictionary={SitecoreDictionary.GlobalsPriceLabelsTotal}
                                    />

                                    {basketInfo.price !== basketInfo.pricePP && (
                                        <PriceLabel
                                            tag='div'
                                            className='amendment-basket__price-pp'
                                            price={pricePPLabel}
                                            priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPerson}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {!hideButton && (
                            <div className='amendment-basket__cell'>
                                <Button className='amendment-basket__btn' type='button' onClick={handleSubmitBasket}>
                                    {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        />
    );
};

export default observer(AmendmentBasket);
