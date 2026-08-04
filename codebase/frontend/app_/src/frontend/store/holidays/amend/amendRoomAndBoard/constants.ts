import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';

export const AMEND_ROOM_AND_BOARD_DISABLED_STATUSES = [
    AmendBookingStatus.AmendRoomAndBoardDisabledByAtcom,
    AmendBookingStatus.AmendRoomAndBoardDisabledByChangeCountLimit,
    AmendBookingStatus.AmendRoomAndBoardDisabledByFlightsDisruption,
    AmendBookingStatus.AmendRoomAndBoardDisabledByHavingMultipleRooms,
    AmendBookingStatus.AmendRoomAndBoardDisabledByTimeBound,
    AmendBookingStatus.AmendRoomAndBoardDisabledOnSite,
];
