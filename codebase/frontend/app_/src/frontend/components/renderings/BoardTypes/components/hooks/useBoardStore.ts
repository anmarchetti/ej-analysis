import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IOfferWithoutAltBoards } from 'models/data/IOffer';
import { useRoomAndBoardLocalStore } from 'frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore';

interface IBoardStoreProps {
    allBoardTypes: IBoardType[] | IAltBoard[];
    offer: Nullable<IAmendHotelOffer | IBookingInfo | IOfferWithoutAltBoards>;
    selectedBoardType: Nullable<IBoardType | IAltBoard>;
    changeBoardCodeError?: (boardCode?: Nullable<string>) => void;
    failedToLoadData?: boolean;
}

const useBoardStore = (isPostBooking: boolean): IBoardStoreProps => {
    const { postBookingProps, bookFlowProps } = useStore((stores: TStores) => ({
        postBookingProps: {
            offer: stores.viewBookingStore.booking,
            failedToLoadData: stores.bookingStore.failedToLoadData,
            selectedBoardType: isHolidayStore(stores) ? stores.amendRoomAndBoardStore.chosenRoom?.boardType : null,
            allBoardTypes: isHolidayStore(stores) ? stores.amendRoomAndBoardStore.altBoards : [],
            changeBoardCodeError: stores.bookingStore.changeBoardCodeError,
        },
        bookFlowProps: {
            offer: stores.bookingStore.selectedOffer,
            failedToLoadData: stores.bookingStore.failedToLoadData,
            selectedBoardType: stores.bookingStore.boardType,
            allBoardTypes: stores.bookingStore.allBoardTypes,
            changeBoardCodeError: stores.bookingStore.changeBoardCodeError,
        },
    }));

    const {
        chosenBoard: selectedBoardType,
        allBoardTypes = [],
        chosenOffer: offer,
    } = useRoomAndBoardLocalStore() ?? {};
    const localStoreProps = {
        selectedBoardType,
        allBoardTypes,
        offer,
    };

    if (isPostBooking) {
        return offer ? localStoreProps : postBookingProps;
    }

    return bookFlowProps;
};

export default useBoardStore;
