import { action, makeObservable, observable } from 'mobx';

import { TRootStore } from 'frontend/store/IStores';
import { getWebStorageItem, removeWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { ApiErrors } from 'models/enum/ApiErrors';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { getPromocodeErrors } from 'frontend/components/renderings/PromocodeInput/promocodeInput.utils';

import { IValidationError } from './validation/IValidationError';
import { ApiError } from './ApiError';
import { IUnit } from './IOffer';

export class Promocode {
    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    @observable value: string | undefined;
    @observable isPromocodeApplying: boolean = false;
    @observable promocodeErrorCode: string | undefined = '';
    @observable promocodeForceError: boolean = false;
    @observable promocodeValidationErrors: IValidationError[] = [];

    @action setIsPromocodeApplying = (value: boolean): void => {
        this.isPromocodeApplying = value;
    };

    @action setPromocodeErrorCode = (value: string): void => {
        this.promocodeErrorCode = value;
    };

    @action setPromocodeForceError = (value: boolean): void => {
        this.promocodeForceError = value;
    };

    @action setPromocodeValidationErrors = (value: IValidationError[]): void => {
        this.promocodeValidationErrors = value;
    };

    @action clearPromocodeError = (): void => {
        this.setPromocodeErrorCode('');
        this.setPromocodeValidationErrors([]);
        this.setPromocodeForceError(false);
    };

    @action setPromocodeError = (e: ApiError): void => {
        const { bookingStore, marketStore, layoutStore } = this.rootStore;

        if (e.errorCode === ApiErrors.PromocodeValidation) {
            this.setPromocodeErrorCode(e.errorCode);
        }

        this.setPromocodeValidationErrors(
            getPromocodeErrors(
                e,
                bookingStore.packageInfo?.paymentInfo?.currency,
                marketStore.formatMoney,
                layoutStore.getPhrase,
            ),
        );
        this.setPromocodeForceError(true);
    };

    @action onPromocodeErrorCallback = (e: ApiError): void => {
        this.setIsPromocodeApplying(false);

        const isWrongDiscount =
            !!(e.innerErrors || []).find(e => e.code === ApiErrors.WrongSystemDiscount) ||
            e.errorCode === ApiErrors.WrongDiscount;

        if (!isWrongDiscount) {
            this.clearPromocodeError();
        }

        this.setPromocodeError(e);
        this.rootStore.trackingStore.trackPromocodeError();
        this.rootStore.bookingStore.clearPromoCode();
    };

    /**
     * Generate promocode key, that used in Local Storage. Key is defined by packageId and PAX config.
     * @param packageId - package id
     * @param units - room units that contain PAX settings
     * @returns Key as `[packageId]-([Ai].[Ci].[Ii]){i}`,
     * where i - room index, Ai/Ci/Ii - number of Adults/Children/Infants in i-room.
     */
    getPromoCodeKey = (packageId: string, units: IUnit[]): string => {
        const unitsId = units
            .map(unit => {
                const { adults, children, infants } = unit.occupation;

                return `${adults}.${children}.${infants}`;
            })
            .join('-');

        return `${packageId}-${unitsId}`;
    };

    /**
     * Get `promocode` from LocalStorage
     */
    @action parseFromLocalStorage = (packageId: string, units: IUnit[]): void => {
        const promoCodeKey = this.getPromoCodeKey(packageId, units);
        const storedPromocodes = getWebStorageItem(WebStorageKeys.Promocode, true) || {};
        this.value = storedPromocodes[promoCodeKey];
    };

    isPromocode = (packageId: string, units: IUnit[]): boolean => {
        const promoCodeKey = this.getPromoCodeKey(packageId, units);

        return !!getWebStorageItem(WebStorageKeys.Promocode, true)?.[promoCodeKey];
    };

    setInLocalStorage = (packageId: string, units: IUnit[]): void => {
        if (!this.value) {
            return;
        }

        const promoCodeKey = this.getPromoCodeKey(packageId, units);
        const storedPromocodes = getWebStorageItem(WebStorageKeys.Promocode, true) || {};
        storedPromocodes[promoCodeKey] = this.value;
        setWebStorageItem(WebStorageKeys.Promocode, storedPromocodes);
    };

    /**
     * Remove promocode from LS
     */
    private removeFromLocalStorage = (packageId: string, units: IUnit[]): void => {
        const promoCodeKey = this.getPromoCodeKey(packageId, units);
        const storedPromocodes = getWebStorageItem(WebStorageKeys.Promocode, true) || {};

        if (storedPromocodes.hasOwnProperty(promoCodeKey)) {
            delete storedPromocodes[promoCodeKey];
            setWebStorageItem(WebStorageKeys.Promocode, storedPromocodes);
        }
    };

    /**
     * Remove promocode
     */
    @action clear = (packageId: string, units: IUnit[]): void => {
        if (!this.value) {
            return;
        }

        this.value = undefined;
        this.removeFromLocalStorage(packageId, units);
    };

    /**
     * Removes promocodes for all packages
     */
    @action clearAll = (): void => {
        this.value = undefined;
        removeWebStorageItem(WebStorageKeys.Promocode);
    };
}
