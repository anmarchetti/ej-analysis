import { action, computed, makeObservable, observable, toJS } from 'mobx';

import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { IOffer } from 'models/data/IOffer';
import SiteSettings from 'models/enum/SiteSettings';
import { ICompareDealsFields } from 'frontend/components/renderings/CompareDeals/CompareDeals';

const DEFAULT_MAX_OFFERS_TO_COMPARE = 3;
const MAX_AVAILABLE_OFFERS_TO_COMPARE = 4;
const DEFAULT_MIN_OFFERS_TO_COMPARE = 2;

export interface IOfferWithActionFields extends IOffer {
    link: string;
    onClickViewHoliday: () => void;
    asLink?: string;
}

export class CompareStore {
    @observable isCompareModeEnabled: boolean = false;
    @observable private _comparisonList: IOfferWithActionFields[] = [];
    @observable isCompareOverlayOpened: boolean = false;
    @observable compareDealsFields: ICompareDealsFields | null = null;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    get comparisonListLength(): number {
        return this._comparisonList.length;
    }

    get comparisonList(): IOfferWithActionFields[] {
        return toJS(this._comparisonList);
    }

    get hasMaxItemsToCompare(): boolean {
        return this.comparisonListLength === this.compareDealsMaxItemCount;
    }

    get hasMinItemsToCompare(): boolean {
        return this.comparisonListLength >= this.compareDealsMinItemCount;
    }

    @computed get compareDealsMaxItemCount(): number {
        const count = this.rootStore.layoutStore.getSettingAsNumber(SiteSettings.MaxCompareItemCount);
        const isCountValid = count && !Number.isNaN(count);

        if (isCountValid && count <= MAX_AVAILABLE_OFFERS_TO_COMPARE) {
            return Number(count);
        }

        if (isCountValid && count > MAX_AVAILABLE_OFFERS_TO_COMPARE) {
            return MAX_AVAILABLE_OFFERS_TO_COMPARE;
        }

        return DEFAULT_MAX_OFFERS_TO_COMPARE;
    }

    @computed get compareDealsMinItemCount(): number {
        const count = this.rootStore.layoutStore.getSettingAsNumber(SiteSettings.MinCompareItemCount);

        return count && !Number.isNaN(count) ? Number(count) : DEFAULT_MIN_OFFERS_TO_COMPARE;
    }

    getOfferIdPerPageType = (offer: IOffer): string | undefined => {
        if (this.rootStore.layoutStore.isShortlistPage) {
            return offer.shortlist?.id;
        }

        return offer.accom.id;
    };

    isOfferIdMatch = (offer1: IOffer, offer2: IOffer): boolean => {
        const offer1Id = this.getOfferIdPerPageType(offer1);
        const offer2Id = this.getOfferIdPerPageType(offer2);

        if (offer1Id && offer2Id) {
            return offer1Id === offer2Id;
        }

        return false;
    };

    isOfferSelectedToCompare = (searchingOffer: IOffer): boolean =>
        this._comparisonList.some(o => this.isOfferIdMatch(o, searchingOffer));

    @action activateCompareMode = (): void => {
        this.isCompareModeEnabled = true;
    };

    @action deactivateCompareMode = (): void => {
        this.isCompareModeEnabled = false;
        this.clearComparisonList();
        this.closeCompareOverlay();
    };

    @action clearComparisonList = (): void => {
        this._comparisonList = [];
    };

    @action updateComparisonList = (searchingOffer: IOfferWithActionFields): void => {
        const indexOfSelected = this._comparisonList.findIndex(o => this.isOfferIdMatch(o, searchingOffer));

        if (indexOfSelected === -1) {
            this._comparisonList.push(searchingOffer);
        } else {
            this._comparisonList.splice(indexOfSelected, 1);
        }
    };

    @action closeCompareOverlay = (): void => {
        this.isCompareOverlayOpened = false;
    };

    @action openCompareOverlay = (): void => {
        this.isCompareOverlayOpened = true;
    };

    @action setCompareDealsFields = (fields: ICompareDealsFields): void => {
        this.compareDealsFields = fields;
    };
}
