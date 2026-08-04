import { action, computed, makeObservable, observable } from 'mobx';

import { TWO } from 'code/commonNumbers';
import { ICurrencyFormatOptions, SignDisplay } from 'code/currency';
import { TRootStore } from 'frontend/store/IStores';
import { getPassengersLuggage } from 'frontend/utils/holdLuggage.utils';
import {
    generateExtraLuggageFullInfo,
    generateLargeSportEquipmentInfo,
    generateSmallSportEquipmentInfo,
} from 'frontend/utils/luggage.utils';
import { parseAncString } from 'frontend/utils/seatAndBags.utils';
import { buildLuggageQuery } from 'frontend/utils/url.utils';
import {
    IExtraLuggageContentWithPrice,
    IExtraLuggageInfo,
    IFlightExtraCategory,
    IFlightExtras,
    ILuggageInfoItem,
    ILuggageTrackingProductItem,
} from 'models/data/IFlightExtras';
import { ICheapestLuggage, IHoldLuggageInfo } from 'models/data/IHoldLuggage';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { HoldLuggageCategory } from 'models/enum/HoldLuggage';
import { QueryParamName } from 'models/enum/QueryParamName';
import { NUMBER_OF_ROUTES, OUTBOUND_ROUTE_ID } from 'models/enum/RouteDirection';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';
import { EventTypes } from 'models/enum/tracking/EventTypes';

export interface ILuggageTypes {
    [key: string]: {
        categoryCode: string;
        categoryType: HoldLuggageCategory;
        name: string;
    };
}

export class ExtraLuggage {
    @observable bookingExtras: IFlightExtras[] | null = null;
    @observable luggagePrices: IHoldLuggageInfo = {};
    @observable cabinBagsPrices: number[] = [];
    @observable luggageTypes: ILuggageTypes = {};
    @observable availableLCBQuantity: number[] = [];
    @observable isLCBFullPopupShown: boolean = false;
    @observable isLCBGreenPromoShown: boolean = false;
    @observable isHBGreenPromoShown: boolean = false;
    // Validated luggage(all types: default bags, extra lugggae, LCB)
    @observable extraLuggageInfo: IExtraLuggageInfo | null = null;

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    @computed get defaultBags(): ILuggageInfoItem[] {
        return this.extraLuggageInfo?.items?.filter(item => item.isComplimentary) || [];
    }

    @computed get defaultBag(): ILuggageInfoItem | undefined {
        return this.defaultBags[0];
    }

    @computed get defaultBagsNumber(): number {
        return this.defaultBags.length / NUMBER_OF_ROUTES;
    }

    @computed get defaultBagsOneDirection(): ILuggageInfoItem[] {
        return this.defaultBags.filter(item => item.routeId === OUTBOUND_ROUTE_ID);
    }

    @computed get cheapestHoldLuggage(): ICheapestLuggage | null {
        return this.getCheapestLuggage(HoldLuggageCategory.Bag);
    }

    @computed get cheapestSportLuggage(): ICheapestLuggage | null {
        return this.getCheapestLuggage(HoldLuggageCategory.SportBag);
    }

    /** get parsed luggage selection from url */
    @computed get luggageSelectionFromUrl(): IHoldLuggageInfo | undefined {
        return this.rootStore.queryParamsStore.luggageSelectionFromUrl;
    }

    /** get parsed sport equipment selection from url */
    @computed get sportEquipmentSelectionFromUrl(): IHoldLuggageInfo | undefined {
        return this.rootStore.queryParamsStore.sportEquipmentSelectionFromUrl;
    }

    /** get parsed outbound lcb selection from url */
    @computed get outboundLCBSelectionFromUrl(): string[] {
        return parseAncString(this.rootStore.queryParamsStore.outboundLCBSelectionFromUrl);
    }

    /** get parsed inbound lcb selection from url */
    @computed get inboundLCBSelectionFromUrl(): string[] {
        return parseAncString(this.rootStore.queryParamsStore.inboundLCBSelectionFromUrl);
    }

    get selectedLuggageNumberFromUrl(): number {
        return Object.values(this.luggageSelectionFromUrl || {}).reduce((acc, v) => acc + v, 0);
    }

    get selectedSportEquipmentNumberFromUrl(): number {
        return Object.values(this.sportEquipmentSelectionFromUrl || {}).reduce((acc, v) => acc + v, 0);
    }

    get selectedLargeSportEquipmentNumberFromUrl(): number {
        const { selectedOffer } = this.rootStore.bookingStore;
        const { largeSportEquipmentCategoryCode } = this.rootStore.layoutStore;
        const selectedLuggageFromOffer = selectedOffer?.extraLuggageInfo;

        if (!this.sportEquipmentSelectionFromUrl || !selectedLuggageFromOffer) {
            return 0;
        }

        let totalItems = 0;

        for (const item of Object.keys(this.sportEquipmentSelectionFromUrl)) {
            const matchingItem = selectedLuggageFromOffer.items.find(
                it => it.itemCode === item && it.itemCategoryCode === largeSportEquipmentCategoryCode,
            );

            if (matchingItem) {
                totalItems += this.sportEquipmentSelectionFromUrl[item];
            }
        }

        return totalItems;
    }

    @computed get sportEquipmentPossibleToTransfer(): IHoldLuggageInfo {
        if (!this.extraLuggageInfo) {
            return {};
        }

        const { isTransferRemoveLargeSE, isLargeSERemoveTransfer } = this.rootStore.bookingStore;
        const { sportEquipmentCategoryCodes, largeSportEquipmentCategoryCode } = this.rootStore.layoutStore;

        if (isTransferRemoveLargeSE || isLargeSERemoveTransfer) {
            return generateSmallSportEquipmentInfo(
                this.extraLuggageInfo.items,
                sportEquipmentCategoryCodes,
                largeSportEquipmentCategoryCode,
            );
        }

        return {};
    }

    get isExtraLuggageFromUrlValid(): boolean {
        const {
            guestDetailsStore: { adultsAndChildrenNumber },
            layoutStore: { maxNumberOfAdditionalLuggage, maxNumberOfSportEquipments, maxNumberOfLargeSportsEquipment },
        } = this.rootStore;

        if (this.selectedLuggageNumberFromUrl > adultsAndChildrenNumber * maxNumberOfAdditionalLuggage) {
            return false;
        }

        if (
            this.selectedSportEquipmentNumberFromUrl > adultsAndChildrenNumber * maxNumberOfSportEquipments ||
            this.selectedLargeSportEquipmentNumberFromUrl > maxNumberOfLargeSportsEquipment
        ) {
            return false;
        }

        return true;
    }

    get LCBMaxQuantity(): number {
        if (!this.availableLCBQuantity.length) {
            return 0;
        }

        return Math.min(...this.availableLCBQuantity);
    }

    get isLCBAlmostFull(): boolean {
        if (!this.availableLCBQuantity.length) {
            return false;
        }

        const { adultsAndChildrenNumber } = this.rootStore.guestDetailsStore;

        return adultsAndChildrenNumber > this.LCBMaxQuantity;
    }

    get isLCBFull(): boolean {
        if (!this.availableLCBQuantity.length) {
            return false;
        }

        return this.availableLCBQuantity.includes(0);
    }

    @computed get passengersAvailableForLCBCount(): number {
        return Math.min(this.rootStore.guestDetailsStore.adultsAndChildrenNumber, this.LCBMaxQuantity);
    }

    @action clearExtraLuggage = (): void => {
        this.luggagePrices = {};
        this.luggageTypes = {};
        this.cabinBagsPrices = [];
        this.availableLCBQuantity = [];
        this.setBookingExtra(null);
        this.setExtraLuggageInfo(null);
    };

    @action setBookingExtra = (data: IFlightExtras[] | null): void => {
        this.bookingExtras = data;
    };

    @action setExtraLuggageInfo = (data: IExtraLuggageInfo | null): void => {
        this.extraLuggageInfo = data;
    };

    @action setLuggagePricesAndTypes = (): void => {
        const { largeCabinBagCode } = this.rootStore.layoutStore;

        if (!this.bookingExtras) {
            return;
        }

        const [luggagePrices, luggageTypes] = [{}, {}];

        for (const route of this.bookingExtras) {
            for (const category of route.flightExtraCategories) {
                const { flightExtras, categoryCode, categoryType } = category;

                if (flightExtras.length > 0) {
                    for (const bag of category.flightExtras) {
                        const { name, flightExtraCode, adultPrice, availableQuantity } = bag;

                        luggageTypes[flightExtraCode] = {
                            categoryCode,
                            categoryType,
                            name,
                        };

                        if (flightExtraCode === largeCabinBagCode) {
                            this.cabinBagsPrices.push(adultPrice);
                            this.availableLCBQuantity.push(availableQuantity);
                        } else if (flightExtraCode in luggagePrices) {
                            luggagePrices[flightExtraCode] += adultPrice;
                        } else {
                            luggagePrices[flightExtraCode] = adultPrice;
                        }
                    }
                }
            }
        }

        this.luggageTypes = luggageTypes;
        this.luggagePrices = luggagePrices;
    };

    @action actualizeLuggageParams = async (
        selectedLuggage: IHoldLuggageInfo,
        selectedSportEquipment: IHoldLuggageInfo,
    ): Promise<void> => {
        const { routerStore, queryParamsStore, trackingStore } = this.rootStore;
        const luggageParams = {
            [QueryParamName.SelectedLuggage]: '',
            [QueryParamName.SelectedSportEquipment]: '',
        };

        const selectedLuggageQuery = buildLuggageQuery(selectedLuggage);
        const selectedSportEquipmentQuery = buildLuggageQuery(selectedSportEquipment);

        if (selectedLuggageQuery) {
            luggageParams[QueryParamName.SelectedLuggage] = selectedLuggageQuery;
        }

        if (selectedSportEquipmentQuery) {
            luggageParams[QueryParamName.SelectedSportEquipment] = selectedSportEquipmentQuery;
        }

        await routerStore.updateCurrentPage(queryParamsStore.buildHotelDetailsQuery(undefined, luggageParams));
        trackingStore.trackBookingExtrasUpdate(EventTypes.ExtrasBagsUpdate);
    };

    @action confirmExtraLuggage = (
        selectedLuggage: IHoldLuggageInfo,
        selectedSportEquipment: IHoldLuggageInfo,
        onError: () => void,
    ): void => {
        const { defaultBags, generateExtraLuggageItems, existingLCBItems, setExtraLuggageInfo } = this;
        const { bookingStore } = this.rootStore;

        const newHoldLuggageItems = generateExtraLuggageItems(selectedLuggage, selectedSportEquipment);
        const luggageItems = [...defaultBags, ...existingLCBItems, ...newHoldLuggageItems];

        const onSuccess = async (): Promise<void> => {
            await this.actualizeLuggageParams(selectedLuggage, selectedSportEquipment);

            bookingStore.showSEAccommodationPopupIfNeeded();
        };

        setExtraLuggageInfo({ items: luggageItems });
        bookingStore.togglePriceManipulating(true);
        bookingStore.validatePackage(undefined, undefined, undefined, onSuccess, onError);
    };

    @computed get lcbInfoFromBookingExtras(): Record<string, IFlightExtraCategory> {
        return (
            this.bookingExtras?.reduce((result, extra) => {
                const lcbCategory = extra.flightExtraCategories.find(
                    category =>
                        !!category.flightExtras.find(
                            bag => bag.flightExtraCode === this.rootStore.layoutStore.largeCabinBagCode,
                        ),
                );

                if (lcbCategory) {
                    result[extra.routeId] = lcbCategory;
                }

                return result;
            }, {} as Record<string, IFlightExtraCategory>) || {}
        );
    }

    @computed get sportEquipmentNumber(): number {
        if (!this.extraLuggageInfo) {
            return 0;
        }

        const { isViewBookingPage, isConfirmationPage, sportEquipmentCategoryCodes } = this.rootStore.layoutStore;
        let totalSportEquipmentCount = 0;

        this.extraLuggageInfo.items.forEach(({ price, quantity, itemCategoryCode }) => {
            if (!(isViewBookingPage || price || isConfirmationPage)) {
                return;
            }

            if (sportEquipmentCategoryCodes.includes(itemCategoryCode)) {
                // luggage duplicates per route
                totalSportEquipmentCount += +quantity / NUMBER_OF_ROUTES;
            }
        });

        return totalSportEquipmentCount;
    }

    @computed get largeSportEquipmentNumber(): number {
        let count = 0;

        if (!this.extraLuggageInfo) {
            return count;
        }

        const { largeSportEquipmentCategoryCode } = this.rootStore.layoutStore;

        this.extraLuggageInfo.items.forEach(item => {
            const { quantity, itemCategoryCode, isComplimentary } = item;

            if (!isComplimentary && itemCategoryCode === largeSportEquipmentCategoryCode) {
                // luggage duplicates per route
                count += +quantity / NUMBER_OF_ROUTES;
            }
        });

        return count;
    }

    @computed get isLCBAddingUnavailable(): boolean {
        const { isCabinBagsEnabled } = this.rootStore.layoutStore;
        const { cabinBagsCategoriesExist, isFlightExtrasFailed, isFlightExternal } = this.rootStore.bookingStore;

        const isLCBUnavailable =
            !cabinBagsCategoriesExist ||
            isFlightExtrasFailed ||
            !isFlightExternal ||
            !isCabinBagsEnabled ||
            this.isLCBFull;

        if (isLCBUnavailable) {
            return true;
        }

        return !this.getLargeCabinBagsFormattedPrice(false, true);
    }

    getLargeCabinBagsPriceByRoute = (isOutbound: boolean = true): number | undefined => {
        const { layoutStore } = this.rootStore;

        if (this.extraLuggageInfo?.items.length) {
            const { largeCabinBagCode } = layoutStore;
            const routeId = isOutbound ? SeatMapFlightDirection.Outbound : SeatMapFlightDirection.Inbound;

            const lcbBag = this.extraLuggageInfo.items.find(
                bag => bag.itemCode === largeCabinBagCode && bag.routeId === routeId,
            );

            return lcbBag?.price;
        }

        if (!this.cabinBagsPrices.length) {
            return;
        }

        const [outboundPrice, returnPrice] = this.cabinBagsPrices;

        return isOutbound ? outboundPrice : returnPrice;
    };

    getLargeCabinBagsFormattedPrice = (withSign: boolean = false, isPricePerPerson: boolean = false): string => {
        if (!this.cabinBagsPrices.length) {
            return '';
        }

        const { currency, formatMoney } = this.rootStore.marketStore;
        const options: ICurrencyFormatOptions = { currency, minimumFractionDigits: 2 };

        let price = this.cabinBagsPrices.reduce((acc, v) => acc + v, 0);

        if (withSign) {
            options.signDisplay = SignDisplay.Always;
        }

        if (isPricePerPerson) {
            price = price / TWO;
        }

        return formatMoney(price, options);
    };

    getExtraLuggageProductsForTracking = (): ILuggageTrackingProductItem[] => {
        const { largeCabinBagCode, isExtraLuggageEnabled } = this.rootStore.layoutStore;

        if (!this.extraLuggageInfo || !isExtraLuggageEnabled) {
            return [];
        }

        const products = {};

        this.existingExtraLuggageItems.forEach(({ price, itemCode, quantity, routeId, name }) => {
            if (largeCabinBagCode === itemCode) return;

            const id = `${itemCode}_${routeId}`;

            if (products[id]) {
                products[id].quantity += quantity;
            } else {
                products[id] = {
                    routeId,
                    price,
                    quantity,
                    title: name,
                };
            }
        });

        return Object.values(products);
    };

    @computed get LCBCount(): number {
        // lcb duplicates per route
        return this.existingLCBItems.length / NUMBER_OF_ROUTES;
    }

    @computed get largeSportEquipmentList(): string {
        if (!this.extraLuggageInfo) {
            return '';
        }

        const { largeSportEquipmentCategoryCode } = this.rootStore.layoutStore;
        const largeSportEquipment = generateLargeSportEquipmentInfo(
            this.extraLuggageInfo.items,
            largeSportEquipmentCategoryCode,
        );

        const items = Object.values(largeSportEquipment).map(bag => `${bag.quantity} x ${bag.name}`);

        return `(${items.join(', ')})`;
    }

    @computed get extraLuggageFullInfo(): Record<string, IExtraLuggageContentWithPrice>[] {
        if (!this.extraLuggageInfo) {
            return [{}, {}];
        }

        const { sportEquipmentCategoryCodes, holdLuggageCategoryCodes } = this.rootStore.layoutStore;
        const [selectedLuggage, selectedSportEquipment] = generateExtraLuggageFullInfo(
            this.extraLuggageInfo.items,
            sportEquipmentCategoryCodes,
            holdLuggageCategoryCodes,
        );

        const lugaggeWithPrices: Record<string, IExtraLuggageContentWithPrice> = {};
        const sportItemsWithPrices: Record<string, IExtraLuggageContentWithPrice> = {};
        Object.entries(selectedLuggage).forEach(([key, value]) => {
            lugaggeWithPrices[key] = { ...value, price: this.luggagePrices[key] };
        });
        Object.entries(selectedSportEquipment).forEach(([key, value]) => {
            sportItemsWithPrices[key] = { ...value, price: this.luggagePrices[key] };
        });

        return [lugaggeWithPrices, sportItemsWithPrices];
    }

    generatePassengerLCBItems = (passengerId: string): ILuggageInfoItem[] => {
        const lcbBagCode = this.rootStore.layoutStore.largeCabinBagCode;

        return Object.values(SeatMapFlightDirection).map(routeId => {
            const lcbCategory = this.lcbInfoFromBookingExtras[routeId];
            const lcbBag = lcbCategory.flightExtras.find(extras => extras.flightExtraCode === lcbBagCode);

            return {
                routeId,
                passengerId,
                itemCode: lcbBagCode,
                itemCategoryCode: lcbCategory.categoryCode,
                quantity: 1,
                price: lcbBag?.adultPrice || 0,
                isComplimentary: false,
                name: lcbBag?.name || '',
                icon: lcbBag?.icon || '',
                description: lcbBag?.description || '',
            };
        });
    };

    generateExtraLuggageItems = (
        selectedLuggage: IHoldLuggageInfo = {},
        selectedSportEquipment: IHoldLuggageInfo = {},
    ): ILuggageInfoItem[] => {
        const { bookingExtras, luggagePrices, luggageTypes, rootStore } = this;
        const { adultsAndChildrenNumber } = rootStore.guestDetailsStore;
        const { isExtraLuggageEnabled } = rootStore.layoutStore;

        if (
            !adultsAndChildrenNumber ||
            !isExtraLuggageEnabled ||
            !bookingExtras?.length ||
            !Object.keys(luggagePrices).length ||
            !Object.keys(luggageTypes).length
        ) {
            return [];
        }

        const luggagePerPassengers = [
            ...getPassengersLuggage(selectedLuggage, adultsAndChildrenNumber),
            ...getPassengersLuggage(selectedSportEquipment, adultsAndChildrenNumber),
        ];

        if (!luggagePerPassengers.length) {
            return [];
        }

        // creating luggage items corresponding to API format
        let items: ILuggageInfoItem[] = [];

        for (const route of bookingExtras) {
            items = items.concat(
                luggagePerPassengers
                    .map(({ passengerId, code, quantity }) => {
                        const bag = luggageTypes[code];

                        if (!bag) {
                            return null;
                        }

                        let bagPrice = 0;
                        route.flightExtraCategories.find(({ flightExtras }) => {
                            const bag = flightExtras.find(({ flightExtraCode }) => flightExtraCode === code);

                            if (bag) {
                                bagPrice = bag?.adultPrice || 0;
                            }

                            return !!bag;
                        });

                        return {
                            routeId: route.routeId,
                            passengerId,
                            itemCode: code,
                            itemCategoryCode: bag.categoryCode,
                            quantity,
                            price: bagPrice,
                        };
                    })
                    .filter(Boolean) as ILuggageInfoItem[],
            );
        }

        return items;
    };

    convertExtraLuggage = (
        roomAllocation: IQueryRoom[],
        isSportEquipment: boolean,
        luggage?: IHoldLuggageInfo,
    ): { adultsLuggage: Record<string, number>; childrenLuggage: Record<string, number> } | void => {
        if (!luggage) return;

        const { maxNumberOfSportEquipments, maxNumberOfAdditionalLuggage } = this.rootStore.layoutStore;

        const allowance = isSportEquipment ? maxNumberOfSportEquipments : maxNumberOfAdditionalLuggage;

        let adultsNumber = 0;
        let childrenNumber = 0;

        roomAllocation.forEach(item => {
            adultsNumber += item.adults || 0;
            childrenNumber += item.children || 0;
        });

        const adultsAndChildrenNumber = adultsNumber + childrenNumber;

        const adultsLuggage = {};
        const childrenLuggage = {};

        let allowanceAdults = adultsNumber * allowance;
        const allowanceChildren = childrenNumber * allowance;

        Object.entries(luggage).forEach(([itemCode, quantity]) => {
            let remainingQuantity = quantity;
            for (let i = 0; i < adultsAndChildrenNumber && remainingQuantity > 0; i++) {
                const isAdult = i < adultsNumber;
                const allocation = Math.min(remainingQuantity, isAdult ? allowanceAdults : allowanceChildren);
                const targetLuggage = isAdult ? adultsLuggage : childrenLuggage;

                targetLuggage[itemCode] = (targetLuggage[itemCode] || 0) + allocation;
                remainingQuantity -= allocation;

                if (isAdult) {
                    allowanceAdults -= allocation;
                }
            }
        });

        return { childrenLuggage, adultsLuggage };
    };

    /**
     * 1. Find bags with same type in all routes
     * 2. Calculate sum of all bags with same type
     * 3. Return the cheapest sum
     */
    getCheapestLuggage = (code: string): ICheapestLuggage | null => {
        if (!this.bookingExtras) {
            return null;
        }

        const bagsByType = {};

        for (const route of this.bookingExtras) {
            for (const category of route.flightExtraCategories) {
                if (category.categoryType === code && category.flightExtras.length > 0) {
                    for (const bag of category.flightExtras) {
                        const bagType = bag.flightExtraCode;

                        if (bagType in bagsByType) {
                            bagsByType[bagType].push(bag);
                        } else {
                            bagsByType[bagType] = [bag];
                        }
                    }
                }
            }
        }

        let cheapestSum = Infinity;
        let cheapestBagType;

        for (const bagType in bagsByType) {
            const sum = bagsByType[bagType].reduce((acc, bag) => acc + bag.adultPrice, 0);

            if (sum < cheapestSum) {
                cheapestSum = sum;
                cheapestBagType = bagType;
            }
        }

        return cheapestBagType ? { name: bagsByType[cheapestBagType][0].name, price: cheapestSum } : null;
    };

    @computed get existingLCBItems(): ILuggageInfoItem[] {
        return (
            this.extraLuggageInfo?.items?.filter(
                item => item.itemCode === this.rootStore.layoutStore.largeCabinBagCode,
            ) || []
        );
    }

    @computed get existingExtraLuggageItems(): ILuggageInfoItem[] {
        return (
            this.extraLuggageInfo?.items?.filter(
                item => !item.isComplimentary && item.itemCode !== this.rootStore.layoutStore.largeCabinBagCode,
            ) || []
        );
    }

    @computed get existingExtraLuggageItemsNumber(): number {
        const totalQuantity = this.existingExtraLuggageItems.reduce((sum, item) => sum + item.quantity, 0);

        return totalQuantity / NUMBER_OF_ROUTES;
    }

    @computed get totalHoldLuggageItemsNumber(): number {
        return this.existingExtraLuggageItemsNumber + this.defaultBagsNumber;
    }

    @computed get isSportsEquipmentAvailable(): boolean {
        const { isSportsEquipmentEnabled } = this.rootStore.layoutStore;

        return !!(isSportsEquipmentEnabled && this.cheapestSportLuggage);
    }

    @computed get isHoldLuggageAvailable(): boolean {
        const { isHoldLuggageEnabled } = this.rootStore.layoutStore;

        return !!(isHoldLuggageEnabled && this.cheapestHoldLuggage);
    }

    @computed get extraLuggagePriceTotal(): number {
        const {
            holdLuggageCategoryCodes,
            sportEquipmentCategoryCodes,
            isSportsEquipmentEnabled,
            isExtraLuggageEnabled,
            isHoldLuggageEnabled,
            largeCabinBagCode,
            isCabinBagsEnabled,
        } = this.rootStore.layoutStore;

        const luggageItems = this.extraLuggageInfo?.items;

        if (!luggageItems?.length || !(isCabinBagsEnabled || isExtraLuggageEnabled)) return 0;

        const holdLuggageCodesSet = new Set(holdLuggageCategoryCodes);
        const sportEquipmentCodesSet = new Set(sportEquipmentCategoryCodes);

        const totalLuggagePrice = luggageItems.reduce((total, item) => {
            if (isHoldLuggageEnabled && holdLuggageCodesSet.has(item.itemCategoryCode)) {
                total += item.price * item.quantity;
            }

            if (isSportsEquipmentEnabled && sportEquipmentCodesSet.has(item.itemCategoryCode)) {
                total += item.price * item.quantity;
            }

            if (isCabinBagsEnabled && largeCabinBagCode === item.itemCode) {
                total += item.price * item.quantity;
            }

            return total;
        }, 0);

        return +totalLuggagePrice.toFixed(TWO);
    }

    @computed get extraLuggagePricePP(): number {
        return Math.ceil(this.extraLuggagePriceTotal / this.rootStore.searchStore.searchWho.totalPaidGuestPlaces);
    }

    validateLCB = async (
        itemsToValidate: ILuggageInfoItem[],
        isSingle: boolean,
        isAddEvent?: boolean,
    ): Promise<void> => {
        const { togglePriceManipulating, validatePackage } = this.rootStore.bookingStore;
        const { updatePageWithLCBQuery } = this.rootStore.queryParamsStore;
        const { trackLCBChange } = this.rootStore.trackingStore;

        const lcbItemsToValidate = itemsToValidate.filter(
            item => item.itemCode === this.rootStore.layoutStore.largeCabinBagCode,
        );
        const uniqItemsNumberPerFlight = (lcbItemsToValidate.length - this.existingLCBItems.length) / NUMBER_OF_ROUTES;
        const quantityToTrack = isSingle ? 1 : uniqItemsNumberPerFlight;

        const onSuccess = (): void => {
            let eventType: EventTypes;

            if (!isSingle) {
                eventType = EventTypes.AddLCBForAllPassengers;
            } else if (isAddEvent === true) {
                eventType = EventTypes.AddToBasket;
            } else {
                eventType = EventTypes.RemoveFromBasket;
            }

            trackLCBChange(eventType, quantityToTrack, false);
            updatePageWithLCBQuery();
        };

        this.setExtraLuggageInfo({
            items: itemsToValidate,
        });

        togglePriceManipulating(true);
        await validatePackage(undefined, undefined, undefined, onSuccess);
    };

    @action setLCBFullPopupShown = (state: boolean): void => {
        this.isLCBFullPopupShown = state;
    };

    @action setLCBGreenPromoShown = (state: boolean): void => {
        this.isLCBGreenPromoShown = state;
    };

    @action setHBGreenPromoShown = (state: boolean): void => {
        this.isHBGreenPromoShown = state;
    };

    LCBAvailabilityCheckFlow = (): void => {
        if (this.isLCBFull && !!this.existingLCBItems.length) {
            const { flightsPassengersStore, queryParamsStore } = this.rootStore;
            const { trackLCBChange } = this.rootStore.trackingStore;

            flightsPassengersStore.clearAllPassengersLCB();
            queryParamsStore.updatePageWithLCBQuery();
            this.setExtraLuggageInfo({
                items: [...this.defaultBags, ...this.existingExtraLuggageItems],
            });
            trackLCBChange(EventTypes.RemoveFromBasket, this.outboundLCBSelectionFromUrl.length, true);
            this.setLCBFullPopupShown(true);
        }
    };

    @computed get canAddHoldLuggage(): boolean {
        const { bookingStore, layoutStore } = this.rootStore;

        return (
            !bookingStore.isLuxuryPackage &&
            layoutStore.isExtraLuggageEnabled &&
            bookingStore.isFlightExternal &&
            !!(this.cheapestSportLuggage || this.cheapestHoldLuggage)
        );
    }
}
