import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { getCreditPaidAmount } from 'frontend/utils/payment.utls';
import { getEcommerceProductFromBaseProduct } from 'frontend/utils/tracking/boardsAndRooms.utils';
import {
    getBoardsTypes,
    getBrand,
    getCategoryLabel,
    getRoomsTypesTitles,
    getTimestamp,
} from 'frontend/utils/tracking/tracking.utils';
import { IRoomVariant } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IRoom } from 'models/data/IHotel';
import { IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { IBaseHolidayProduct } from 'models/data/tracking/IProduct';
import { AmendProductPBPostfix } from 'models/enum/tracking/AmendProductPBPostfix';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { BrandValues } from 'models/enum/tracking/GenericEventParams';
import PageLoadCategory from 'models/enum/tracking/PageLoadCategory';
import { ProductCategories } from 'models/enum/tracking/ProductCategories';

enum ChangeType {
    ChangeRoomAndBoard = 'CRB',
    ChangeRoom = 'CR',
    ChangeBoard = 'CB',
}

export class TrackingStoreRoomAndBoard {
    constructor(public rootStore: HolidaysRootStore) {}

    buildEcommerceProduct = (eventType: EventTypes, params: Record<string, string | number>): object => {
        const {
            trackingStore: { buildBaseHolidayProduct },
            viewBookingStore: { booking },
        } = this.rootStore;

        if (!booking) return {};

        const {
            package: {
                accom: { hotel },
            },
            promoCollections,
        } = booking;

        const isLuxuryHoliday = containsLuxuryPromoCode(promoCollections);

        const [outboundInfo] = booking.package.transport.routes;
        const baseHolidayProduct = buildBaseHolidayProduct(
            booking,
            eventType,
            undefined,
            {
                metric3: 0,
                id: '',
                quantity: 1,
                variant: hotel.theme?.itemName,
                brand: isLuxuryHoliday ? BrandValues.LuxuryCollection : getBrand(hotel.type, booking.prom),
                ...params,
            },
            true,
        );

        if (!baseHolidayProduct) return {};

        return getEcommerceProductFromBaseProduct({
            ...baseHolidayProduct,
            dimension18: outboundInfo.depName,
            dimension20: outboundInfo.arrName,
        });
    };

    public trackNewRoomOrBoardClick = (
        eventType: EventTypes.PostBookingChangeBoardSelect | EventTypes.PostBookingChangeRoomSelect,
        name: string,
        priceDifference: number,
    ): void => {
        const { booking } = this.rootStore.viewBookingStore;
        const {
            pageMeta: { pageCategory, pageName },
            addToDataLayer,
        } = this.rootStore.trackingStore;

        if (!booking) {
            return;
        }

        const { bookingReference } = booking;

        const isBoardClick = eventType === EventTypes.PostBookingChangeBoardSelect;
        const categoryType = isBoardClick ? ProductCategories.ChangeBoard : ProductCategories.ChangeRoom;
        const category = `${categoryType}: ${this.getChangeType(priceDifference)}`;

        const additionalCost = priceDifference > 0 ? priceDifference : 0;

        const ecommerceProduct = this.buildEcommerceProduct(eventType, {
            category,
            name,
            revenue: additionalCost,
            price: additionalCost,
            metric6: priceDifference < 0 ? Math.abs(priceDifference) : 0,
        });

        const pageTitle = `${pageCategory}: ${pageName}`;

        addToDataLayer({
            event: eventType,
            dimension173: bookingReference,
            dimension136: pageTitle,
            ecommerce: {
                click: {
                    actionField: {
                        list: isBoardClick
                            ? PageLoadCategory.PostBookingChangeBoard
                            : PageLoadCategory.PostBookingChangeRoom,
                        action: 'click',
                    },
                    products: [ecommerceProduct],
                },
            },
        });
    };

    private getChangeType = (price: number): AmendProductPBPostfix =>
        price >= 0 ? AmendProductPBPostfix.UPGRADE : AmendProductPBPostfix.DOWNGRADE;

    getRoomAndBoardType = (units: (IRoom | IUnit)[]): string => {
        const roomName = getRoomsTypesTitles(units);
        const boardName = getBoardsTypes(units);

        return `${roomName} | ${boardName}`;
    };

    getRoomAndBoardsSuffixAndName = (
        previousRooms: (IRoom | IUnit)[],
        newlySelectedRooms: IUnit[],
    ): { idSuffix: ChangeType; name: string } => {
        const hasRoomTypeChanged = newlySelectedRooms[0].code !== previousRooms[0].code;
        const hasBoardTypeChanged = newlySelectedRooms[0].board !== previousRooms[0].board;
        const roomName = getRoomsTypesTitles([newlySelectedRooms[0]]);
        const boardName = getBoardsTypes([newlySelectedRooms[0]]);

        const hasChangedRoomAndBoard = hasRoomTypeChanged && hasBoardTypeChanged;

        const roomOrBoardSuffix = hasRoomTypeChanged ? ChangeType.ChangeRoom : ChangeType.ChangeBoard;
        const roomOrBoardName = hasRoomTypeChanged ? roomName : boardName;

        const idSuffix = hasChangedRoomAndBoard ? ChangeType.ChangeRoomAndBoard : roomOrBoardSuffix;
        const name = hasChangedRoomAndBoard ? `${roomName} | ${boardName}` : roomOrBoardName;

        return {
            idSuffix,
            name,
        };
    };

    buildAmendRoomAndBoardProduct = (
        eventType: EventTypes,
        offer: IOfferWithoutAltBoards,
        prevSelectedPackage: IRoomVariant,
        selectedPackage: IRoomVariant,
    ): Nullable<IBaseHolidayProduct> => {
        const { productPrice, metric6 } = this.rootStore.trackingStore.getPrices(selectedPackage.amendmentPaymentInfo);

        const { name } = this.getRoomAndBoardsSuffixAndName(prevSelectedPackage.units, selectedPackage.units);
        const category = getCategoryLabel(ProductCategories.RoomAndBoard, selectedPackage.amendmentCharges);

        return this.rootStore.trackingStore.buildBaseHolidayProduct(offer, eventType, 0, {
            category,
            name,
            id: '',
            quantity: 1,
            price: productPrice,
            metric6,
            dimension108: eventType,
            dimension15: offer.totalPrice,
        });
    };

    public trackRoomAndBoardConfirmClick = (
        eventType: EventTypes.PostBookingChangeBoardUpdate | EventTypes.PostBookingConfirmationBasket,
    ): void => {
        const { booking, viewBookingPayload } = this.rootStore.viewBookingStore;
        const { chosenRoomVariant: chosenRoomVariantFromStore } = this.rootStore.amendRoomAndBoardStore;
        const {
            addToDataLayer,
            pageMeta: { pageCategory, pageName },
            pageLang,
        } = this.rootStore.trackingStore;

        const amendPaymentPayload = viewBookingPayload?.amendPaymentPayload;
        const chosenRoomVariantFromPayload = amendPaymentPayload?.amendRoomAndBoardOffer?.selectedRoomVariant;

        const previousRooms = viewBookingPayload?.rooms || booking?.package.accom.rooms;

        const chosenRoomVariant = chosenRoomVariantFromStore || chosenRoomVariantFromPayload;

        const { promoCodeBreakDown } = chosenRoomVariant || {};

        if (!booking || !chosenRoomVariant) {
            return;
        }

        const { bookingReference } = booking;

        const isConfirmationEvent = eventType === EventTypes.PostBookingConfirmationBasket;
        const totalRooms = chosenRoomVariant.units.length;
        const isMultiroom = !!amendPaymentPayload?.isMultiroom && totalRooms > 1;
        const roomStatus = isMultiroom ? 'MultiRoom' : 'SingleRoom';

        const dimension136 = `${pageCategory}: ${
            isConfirmationEvent ? `Room & Board Confirmation|${pageLang}` : pageName
        }`;

        const { idSuffix } = this.getRoomAndBoardsSuffixAndName(previousRooms!, chosenRoomVariant.units);

        const boardChangedUnits = chosenRoomVariant.units.filter((unit, index) => {
            const previousRoom = previousRooms![index] ?? previousRooms![0];

            return unit.board !== previousRoom.board;
        });

        const roomChangedUnitsWithIndex = chosenRoomVariant.units.reduce<{ index: number; unit: IUnit }[]>(
            (acc, unit, index) => {
                const previousRoom = previousRooms![index] ?? previousRooms![0];

                if (unit.code !== previousRoom.code) {
                    acc.push({ unit, index });
                }

                return acc;
            },
            [],
        );

        const perRoomRoomCharges = amendPaymentPayload?.perRoomRoomCharges;
        const totalAmendmentPrice =
            amendPaymentPayload?.totalAmendmentPrice ??
            this.rootStore.trackingStore.getPrices(chosenRoomVariant.amendmentPaymentInfo, isConfirmationEvent)
                .amendmentCharges;

        const totalRoomCharges = roomChangedUnitsWithIndex.reduce((sum, { index }) => {
            const roomCharge = perRoomRoomCharges?.[index] ?? chosenRoomVariant.units[index].price ?? 0;

            return sum + Math.abs(roomCharge);
        }, 0);

        const sign = totalAmendmentPrice >= 0 ? 1 : -1;
        const boardHasChanged = boardChangedUnits.length > 0;
        const roomHasChanged = roomChangedUnitsWithIndex.length > 0;

        let boardCost = 0;

        if (boardHasChanged && roomHasChanged) {
            boardCost = sign * (Math.abs(totalAmendmentPrice) - totalRoomCharges);
        } else if (boardHasChanged) {
            boardCost = totalAmendmentPrice;
        }

        const buildAmounts = (cost: number): { metric6: number; price: number; revenue: number } =>
            cost > 0 ? { price: cost, revenue: cost, metric6: 0 } : { price: 0, revenue: 0, metric6: Math.abs(cost) };

        const prices = this.rootStore.trackingStore.getPrices(
            chosenRoomVariant.amendmentPaymentInfo,
            isConfirmationEvent,
        );

        let products: object[];

        if (isMultiroom) {
            const boardProductList: object[] = [];

            if (boardHasChanged) {
                const boardAmounts = buildAmounts(boardCost);
                const boardName = getBoardsTypes([boardChangedUnits[0]]);
                const boardCategory = `Change Board: ${this.getChangeType(Math.round(boardCost))}`;

                boardProductList.push({
                    ...this.buildEcommerceProduct(eventType, {
                        category: boardCategory,
                        name: boardName,
                        price: totalAmendmentPrice < 0 ? 0 : boardAmounts.price,
                        revenue: totalAmendmentPrice < 0 ? 0 : boardAmounts.revenue,
                        metric6: totalAmendmentPrice < 0 ? Math.abs(totalAmendmentPrice) : boardAmounts.metric6,
                    }),
                    item_generic_1: roomStatus,
                    item_generic_2: String(totalRooms),
                });
            }

            const roomProductList: object[] = roomChangedUnitsWithIndex.map(({ unit, index: unitIndex }) => {
                const roomChargeRaw = perRoomRoomCharges?.[unitIndex] ?? unit.price ?? 0;
                const roomCharge = sign * Math.abs(roomChargeRaw);
                const roomAmounts = buildAmounts(roomCharge);
                const roomName = getRoomsTypesTitles([unit]);
                const roomCategory = `Change Room: ${this.getChangeType(Math.round(roomCharge))}`;

                return {
                    ...this.buildEcommerceProduct(eventType, {
                        category: roomCategory,
                        name: roomName,
                        price: roomAmounts.price,
                        revenue: roomAmounts.revenue,
                        metric6: totalAmendmentPrice < 0 ? Math.abs(totalAmendmentPrice) : roomAmounts.metric6,
                    }),
                    item_generic_1: roomStatus,
                    item_generic_2: `${unitIndex + 1}/${totalRooms}`,
                };
            });

            products = [
                ...boardProductList,
                ...roomProductList,
                ...(prices.fees ? [this.rootStore.trackingStore.buildFeesAnalyticProduct(prices.fees)] : []),
            ];
        } else {
            const { name } = this.getRoomAndBoardsSuffixAndName(previousRooms!, chosenRoomVariant.units);
            const category = `Room & Board: ${this.getChangeType(Math.round(prices.amendmentCharges))}`;
            products = [
                {
                    ...this.buildEcommerceProduct(eventType, {
                        category,
                        name,
                        price: prices.productPrice,
                        revenue: prices.revenue,
                        metric6: prices.metric6,
                    }),
                    item_generic_1: roomStatus,
                    item_generic_2: '1/1',
                },
                ...(prices.fees ? [this.rootStore.trackingStore.buildFeesAnalyticProduct(prices.fees)] : []),
            ];
        }

        const ecommerceData = isConfirmationEvent
            ? {
                  ecommerce: {
                      purchase: {
                          actionField: {
                              event: eventType,
                              id: `${bookingReference}_${Date.now()}_PB_${idSuffix}`,
                              timestamp: getTimestamp(),
                              revenue: prices.revenue,
                              coupon: promoCodeBreakDown?.promoCode || '',
                              metric3: getCreditPaidAmount(booking.paymentInfo) ?? 0,
                              action: 'purchase',
                          },
                          products,
                      },
                  },
              }
            : {
                  ecommerce: {
                      currencyCode: booking?.currency?.code,
                      detail: {
                          actionField: {
                              list: PageLoadCategory.PostBookingChangeBoard,
                          },
                          products,
                      },
                  },
              };

        const dimension66 = this.rootStore.viewBookingStore.dimension66;
        const paymentMethod = this.rootStore.viewBookingStore.paymentMethod;

        addToDataLayer({
            event: eventType,
            dimension173: bookingReference,
            dimension136,
            dimension66: dimension66 ?? '',
            paymentMethod: paymentMethod ?? '',
            ...ecommerceData,
        });
    };

    trackNoAvailabilityError = (): void => {
        this.rootStore.trackingStore.trackCustomError('Room & Board', 'No Availability');
    };
}
