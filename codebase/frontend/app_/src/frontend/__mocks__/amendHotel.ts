import { deepClone } from 'frontend/utils/array.utils';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IAmendHotelRoomAndBoardOffer } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IAmendHotelTrackingPayload } from 'models/data/tracking/AmendPayload';
import { mockFeesPerPersons } from 'frontend/components/common/PriceBreakdown/__mocks__/priceBreakdown';

import { mockAccomData } from './accom';
import { extraLuggageInfoMock } from './extraLuggage';
import { mockHotel } from './hotel';
import { mockPromoCodeBreakdown } from './promocode';
import { mockUnitRoom } from './room';
import { mockTransfer } from './transfer';

export const mockAmendHotelOffer: IAmendHotelOffer = {
    accom: mockAccomData,
    amendmentChargesInfo: {
        fullAmendmentCharges: 57.89,
        amendmentCharges: 23.45,
        bookingPrice: 34.44,
        extraLuggagePrice: 0,
        fullOfferPrice: 0,
        fullOfferPpPrice: 0,
        offerPrice: 0,
        offerPpPrice: 0,
        seatsPrice: 0,
        promoCodeBreakDown: mockPromoCodeBreakdown,
    },
    amendmentPaymentInfo: {
        amendmentCharges: 100,
        amendmentChargesWithoutFees: 80,
        feesPerPersons: mockFeesPerPersons,
        packagePriceWithFees: 1200,
        packagePriceWithoutFees: 1120,
        totalFeesAmount: 20,
    },
    extraLuggageInfo: extraLuggageInfoMock,
    hotel: mockHotel,
    transfers: [mockTransfer],
};

export const mockTrackingHotelInitialData: IAmendHotelTrackingPayload = {
    amendmentPaymentInfo: { ...mockAmendHotelOffer.amendmentPaymentInfo },
    transfers: [deepClone(mockTransfer)],
    unit: [deepClone(mockUnitRoom)],
};

export const mockAmendHotelRoomAndBoardOffer: IAmendHotelRoomAndBoardOffer = {
    amendHotelOffer: mockAmendHotelOffer,
    bookingReference: '123',
};
