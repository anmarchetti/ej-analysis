import { IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { getWebStorageItem } from './webStorage.utils';

class OriginalBooking {
    private readonly originalBooking: Nullable<IOfferWithoutAltBoards>;

    constructor() {
        this.originalBooking = getWebStorageItem(WebStorageKeys.OriginalBooking, true, sessionStorage);
    }

    get accommodation(): Nullable<IUnit[]> {
        return this.originalBooking?.accom.unit;
    }

    get transferPrice(): Nullable<number> {
        if (!this.originalBooking) {
            return undefined;
        }

        return this.originalBooking.transfers.length ? this.originalBooking.transfers[0].price : null;
    }
}

export const getOriginalBooking = (): OriginalBooking => new OriginalBooking();
