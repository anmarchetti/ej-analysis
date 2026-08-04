import { IHolidaysInitialState, IHolidaysStores } from './holidays/create-stores';
import { HolidaysRootStore } from './holidays/HolidaysRootStore';
import { ITradePortalInitialState, ITradePortalStores } from './tradePortal/create-stores';
import { TradePortalRootStore } from './tradePortal/TradePortalRootStore';

export type TRootStore = HolidaysRootStore | TradePortalRootStore;
export type TStores = IHolidaysStores | ITradePortalStores;
export type TInitialStoresState = IHolidaysInitialState | ITradePortalInitialState | undefined;

export interface ISssrStore<T> {
    /**
     * Restore store
     * @param initialState Initial state
     */
    deserialize: (initialState?: T) => void;

    /**
     * Convert store to POJO
     */
    serialize: () => T;
}
