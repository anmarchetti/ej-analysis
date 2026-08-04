import { runInAction } from 'mobx';

import { ISpecificOffer } from 'models/data/ISpecificOffer';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { FlightPlusHotelQueryParamName } from 'models/enum/FlightPlusHotelQueryParamName';

import BaseBookingStore from './BaseBookingStore';

export const shouldValidate = (ctx: BaseBookingStore): boolean => {
    const { isExtrasPage, isGuestDetailsPage, isTradePortal } = ctx.rootStore.layoutStore;

    return (
        isExtrasPage ||
        isGuestDetailsPage ||
        (isTradePortal ? ctx.rootStore.layoutStore['isConfirmPage'] : ctx.rootStore.layoutStore['isPaymentPage'])
    );
};

export const beforeCallFetchOffer = async ({
    ctx,
    force,
}: {
    ctx: BaseBookingStore;
    force: boolean;
}): Promise<boolean> => {
    // do not make validate package requests
    const canValidatePackage = shouldValidate(ctx);
    const disableFetchingOffer = canValidatePackage ? ctx.selectedOffer : ctx.selectedOffer?.price;

    if (disableFetchingOffer && !force) {
        // Alternative transfers are loaded only on Extras Page.
        // If Extras Page is opened for the first time, need to load transfers.
        if (!ctx.alternativeTransfers.length) {
            await ctx.loadExtras();
        }

        return true;
    }

    return false;
};

export const handlePreviousPriceForFPH = (ctx: BaseBookingStore): void => {
    const { isNewFlow, isFlightPlusHotelFunnel, removeQueryParam } = ctx.rootStore.queryParamsStore;

    if (!isFlightPlusHotelFunnel || !isNewFlow) {
        return;
    }

    const offerPrice = ctx.cacheOfferPriceExcludingTouristTax || ctx.selectedOffer?.priceExcludingTouristTax;
    removeQueryParam(FlightPlusHotelQueryParamName.IsNewFlow);

    if (offerPrice && offerPrice > 0) {
        runInAction(() => {
            ctx.previousPrice = offerPrice;
        });
    }
};

export const callFetchOffer = async ({
    ctx,
    isExt,
    boardType,
    rooms,
}: {
    ctx: BaseBookingStore;
    boardType?: string;
    isExt?: boolean;
    rooms?: IQueryRoom[];
}): Promise<ISpecificOffer | undefined> => {
    ctx.isLoadingOffer = true;
    const isExternal = isExt ?? ctx.isExtFromUrl;

    return await ctx.callFetchOffer(isExternal, boardType, rooms);
};

export const afterCallFetchOffer = async ({
    ctx,
    offer,
    failSilently,
    onValidateFail,
    disableLoadAlternativeFlights,
}: {
    ctx: BaseBookingStore;
    failSilently: boolean;
    disableLoadAlternativeFlights?: boolean;
    offer?: ISpecificOffer;
    onValidateFail?: () => void;
}): Promise<boolean> => {
    const { isTradePortal } = ctx.rootStore.layoutStore;

    if (!offer) {
        if (!isTradePortal) {
            ctx.onFetchOfferError(failSilently);
        }

        return true;
    }

    if (offer.offers.length > 0) {
        ctx.updateOfferInfo(offer);

        const { guestDetailsStore, engageStore } = ctx.rootStore;

        if (!guestDetailsStore.guestsDetails.length) {
            guestDetailsStore.createGuestsDetails();
        }

        if (!ctx.extraLuggage.isExtraLuggageFromUrlValid) {
            ctx.setShowInvalidLuggageInUrlPopup(true);

            return true;
        }

        if (!isTradePortal) {
            // get extras page content reordering rule from Sitecore Personalize based on promo code
            await engageStore.getOrderingFromPromoCode(offer.offers[0].accom.prom);
        }

        // update hotel details url with correct room code
        await ctx.updateHotelDetailsUrlIfOfferRoomChanged();

        await ctx.loadFlightExtras();

        ctx.extraLuggage.LCBAvailabilityCheckFlow();

        if (shouldValidate(ctx) && !!ctx.hotel) {
            runInAction(() => ctx.parsePromocode());

            await ctx.validatePackage(undefined, false, failSilently, undefined, onValidateFail);

            handlePreviousPriceForFPH(ctx);

            runInAction(() => ctx.setSelectedOfferPrices());
        }

        await ctx.loadAdditionalData(disableLoadAlternativeFlights);

        return true;
    }

    // consider empty offer response as an error
    ctx.onFetchOfferError(failSilently);

    return false;
};
