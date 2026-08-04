import { deepClone } from 'frontend/utils/array.utils';
import {
    IAmendRoomAndBoardInfoResponse,
    IAmendRoomAndBoardOffer,
    IRoomVariant,
} from 'models/data/bookingAmendment/AmendRoomAndBoard';

import { mockAmendPaymentInfo } from './payment';
import { mockPromoCodeBreakdown } from './promocode';
import { mockUnitRoomListMock } from './room';

export const mockRoomAndBoardRoomVariant: IRoomVariant = {
    amendmentCharges: 0,
    bookingPrice: 0,
    boardType: 'boardType_code',
    fullAmendmentCharges: 0,
    offerPrice: 1588,
    offerPricePp: 794,
    seatsPrice: 10,
    units: mockUnitRoomListMock,
    roomType: 'roomType_code',
    promoCodeBreakDown: mockPromoCodeBreakdown,
    amendmentPaymentInfo: mockAmendPaymentInfo,
};

export const mockRoomAndBoardGetRoomVariantsResponse: IAmendRoomAndBoardInfoResponse = {
    roomVariants: deepClone([mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant]),
    upsellAmount: 0,
};

export const mockAmendRoomAndBoardOffer: IAmendRoomAndBoardOffer = {
    selectedRoomVariant: { ...mockRoomAndBoardRoomVariant },
};
