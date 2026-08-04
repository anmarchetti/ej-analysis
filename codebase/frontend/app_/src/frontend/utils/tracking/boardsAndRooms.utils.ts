import { TRoomAlteration } from 'models/data/IHotel';
import { IBaseHolidayProduct, IRoomAndBoardTrackingProduct } from 'models/data/tracking/IProduct';
import { BoardsAndRoomsGenericValues } from 'models/enum/tracking/BoardsAndRooms';

export const ecommerceProductsKeysFromBaseProduct: Array<keyof IRoomAndBoardTrackingProduct> = [
    'category',
    'name',
    'id',
    'quantity',
    'price',
    'variant',
    'brand',
    'currencyCode',
    'coupon',
    'dimension13',
    'dimension15',
    'dimension16',
    'dimension18',
    'dimension19',
    'dimension20',
    'dimension21',
    'dimension23',
    'dimension24',
    'dimension25',
    'dimension26',
    'dimension27',
    'dimension28',
    'dimension35',
    'dimension37',
    'dimension38',
    'dimension40',
    'dimension42',
    'dimension44',
    'dimension45',
    'dimension47',
    'dimension49',
    'dimension50',
    'dimension51',
    'dimension52',
    'dimension53',
    'dimension55',
    'dimension56',
    'dimension63',
    'dimension64',
    'dimension65',
    'dimension73',
    'dimension81',
    'dimension83',
    'dimension84',
    'dimension85',
    'dimension108',
    'metric3',
    'metric6',
    'revenue',
];

export const getPriceChangeStatus = (price: number): BoardsAndRoomsGenericValues => {
    if (price < 0) {
        return BoardsAndRoomsGenericValues.Downgrade;
    }

    if (price > 0) {
        return BoardsAndRoomsGenericValues.Upgrade;
    }

    return BoardsAndRoomsGenericValues.NA;
};

export const getAlterationStatus = (
    requireBoardAlteration: Nullable<boolean>,
    requireMoreRoomAlteration: Nullable<boolean>,
): BoardsAndRoomsGenericValues => {
    if (requireBoardAlteration && requireMoreRoomAlteration) {
        return BoardsAndRoomsGenericValues.BoardAndRoomAlterations;
    }

    if (requireBoardAlteration) {
        return BoardsAndRoomsGenericValues.BoardAlterations;
    }

    if (requireMoreRoomAlteration) {
        return BoardsAndRoomsGenericValues.RoomAlterations;
    }

    return BoardsAndRoomsGenericValues.NA;
};

export const getIsRoomAlterationNeeded = (roomAlterations: TRoomAlteration | []): boolean =>
    Object.values(roomAlterations).some(Boolean);

export const getEcommerceProductFromBaseProduct = (baseProduct: IBaseHolidayProduct): IRoomAndBoardTrackingProduct =>
    ecommerceProductsKeysFromBaseProduct.reduce(
        (acc, key) => ({ ...acc, [key]: baseProduct[key] }),
        {} as IRoomAndBoardTrackingProduct,
    );
