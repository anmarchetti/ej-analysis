import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IChangeFeeInfoFields } from 'frontend/components/renderings/ChangeFeeInfo/ChangeFeeInfo';

export const useChangeFeeInfo = (fields: Nullable<IChangeFeeInfoFields>): { feePP: number; isShown: boolean } => {
    const { amendFlightFeePP, amendDatesFeePP, amendRoomAndBoardFeePP, isAmendHotelPage, amendHotelFeePP } = useStore(
        (stores: IHolidaysStores) => ({
            amendFlightFeePP: stores.amendFlightsStore.feePP,
            amendDatesFeePP: stores.amendDatesStore.feePP,
            amendRoomAndBoardFeePP: stores.amendRoomAndBoardStore.feePP,
            isAmendHotelPage: stores.layoutStore.isAmendHotelPage,
            amendHotelFeePP: stores.amendHotelStore.feePP,
        }),
    );

    const changeFeeForHotels = (isAmendHotelPage && fields?.FeeValue?.value) ?? 0;

    const changeFeeFromFlow =
        amendFlightFeePP || amendDatesFeePP || amendRoomAndBoardFeePP || amendHotelFeePP || changeFeeForHotels || 0;

    return {
        isShown: !!changeFeeFromFlow,
        feePP: changeFeeFromFlow,
    };
};
