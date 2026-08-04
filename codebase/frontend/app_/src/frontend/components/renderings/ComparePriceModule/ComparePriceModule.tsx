import { FC, useEffect } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getDate } from 'frontend/utils/date.utils';
import ComparePriceModuleVariant from 'models/enum/ComparePriceModuleVariant';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';

import ComparePriceButton from './components/ComparePriceButton/ComparePriceButton';
import ComparePriceContent from './components/ComparePriceContent/ComparePriceContent';
import { IComparePriceModuleFields } from './components/ComparePriceContent/ComparePriceContent.utils';
import ComparePriceInfoPopup from './components/ComparePriceInfoPopup/ComparePriceInfoPopup';
import { getInfoPopupProps } from './ComparePriceModule.utils';

export const ComparePrice: FC<ISitecoreComponent<IComparePriceModuleFields>> = ({ fields, params, rendering }) => {
    const variant = fields?.Variant.value;
    const {
        isDisplayed,
        setIsDisplayed,
        setIsPriceToggleHidden,
        setNewOfferState,
        newOfferState,
        isLoadingError,
        setIsLoadingError,
        selectOfferOnPriceGraph,
        isLoadingOfferForNewDate,
        offer,
    } = useStore(stores => ({
        isDisplayed: stores.comparePricesCalendarStore.isDisplayed,
        setIsDisplayed: stores.comparePricesCalendarStore.setIsDisplayed,
        setNewOfferState: stores.comparePricesCalendarStore.setNewOfferState,
        newOfferState: stores.comparePricesCalendarStore.newOfferState,
        isLoadingError: stores.comparePricesCalendarStore.isLoadingError,
        setIsLoadingError: stores.comparePricesCalendarStore.setIsLoadingError,
        isLoadingOfferForNewDate: stores.comparePricesCalendarStore.isLoadingOfferForNewDate,
        selectOfferOnPriceGraph: stores.comparePricesCalendarStore.selectOfferOnPriceGraph,
        setIsPriceToggleHidden: isTradeStore(stores) && stores.layoutStore.setIsPriceToggleHidden,
        offer: stores.bookingStore.selectedOffer,
    }));

    useEffect(() => {
        if (isLoadingError) {
            setIsDisplayed(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingError]);

    useEffect(() => {
        if (!setIsPriceToggleHidden) return;

        setIsPriceToggleHidden(isLoadingOfferForNewDate || isDisplayed);

        return () => setIsPriceToggleHidden(false);
    }, [isLoadingOfferForNewDate, isDisplayed, setIsPriceToggleHidden]);

    if (!fields || !variant || variant === ComparePriceModuleVariant.NothingVariant) return null;

    return (
        <>
            <ComparePriceButton onClick={(): void => setIsDisplayed(true)} />

            {isDisplayed && (
                <ComparePriceContent
                    onClose={(): void => setIsDisplayed(false)}
                    holidayDuration={offer?.accom.stay ?? 0}
                    isResetingSelectedOffer={isLoadingOfferForNewDate}
                    resetSelectedOffer={selectOfferOnPriceGraph}
                    selectedDate={getDate(offer?.date ?? '')}
                    fields={fields}
                    params={params}
                    rendering={rendering}
                />
            )}

            {isLoadingOfferForNewDate && <OverlaySpinner header={fields.LoadingText?.value} />}

            <ComparePriceInfoPopup
                {...getInfoPopupProps({
                    fields,
                    setNewOfferState,
                    newOfferState,
                    isLoading: isLoadingOfferForNewDate,
                    isLoadingError: !isDisplayed && isLoadingError,
                    setIsLoadingError,
                })}
            />
        </>
    );
};

export default observer(ComparePrice);
