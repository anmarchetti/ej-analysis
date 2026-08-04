import {
    createMockStores,
    mockAmendBookingPayload,
    mockAmendDatesOfferWithPrice,
    mockBooking,
    mockPromoCodeBreakdown,
    mockTransfer,
} from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { ExtraLuggage } from 'frontend/store/base/booking/ExtraLuggage';
import { AmendScenarios } from 'models/enum/amend/AmendScenarios';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import SitePath from 'models/enum/SitePath';
import { TransferType } from 'models/enum/transfer/TransferType';

import { AmendTransferStore } from './AmendTransfersStore';
import { AMEND_TRANSFERS_DISABLED_STATUSES } from './constants';

jest.mock('frontend/services/booking.service');
jest.mock('./AmendTransfersStore.utils', () => ({
    getUpgradeTransferPrice: jest.fn().mockReturnValue(mockAmendDatesOfferWithPrice.offerPrice),
}));

const privateTransfer = {
    ...mockTransfer,
    type: TransferType.Private,
};

const noTransfer = {
    ...mockTransfer,
    type: TransferType.NoTransfer,
};

let amendTransferStore: AmendTransferStore;

describe('AmendTransfersStore', () => {
    beforeEach(() => {
        sessionStorage.clear();
        amendTransferStore = new AmendTransferStore(
            createMockStores({
                viewBookingStore: {
                    initBookingFromPayload: jest.fn().mockImplementation(cb => cb()),
                    booking: mockBooking,
                    updateBookingInfo: jest.fn(),
                    allowanceRestrictions: {
                        byLeadPassenger: false,
                    },
                    extraLuggage: {
                        sportEquipmentNumber: 0,
                    },
                },
                amendFlightsStore: {
                    allowanceRestrictions: {},
                },
                routerStore: {
                    redirectToAmendTransferPage: jest.fn(),
                    redirectToViewBookingPage: jest.fn(),
                    redirectToLoginPage: jest.fn(),
                },
                userStore: {
                    checkIfUserLoggedIn: jest.fn().mockReturnValue(Promise.resolve(true)),
                },
                appStore: {
                    setAmendBookingItemPayload: jest.fn(),
                    amendBookingItemPayload: {},
                },
                amendDatesStore: {
                    transfer: {
                        transfersWithAmendCharges: [mockAmendDatesOfferWithPrice],
                    },
                },
            }),
        );
    });

    it('should update setIsUnavailableTransferPopupShown', () => {
        amendTransferStore.isUnavailableTransferPopupShown = false;

        amendTransferStore.setIsUnavailableTransferPopupShown(true);

        expect(amendTransferStore.isUnavailableTransferPopupShown).toBe(true);
    });

    describe('upgradePrice', () => {
        it('Should return right price', () => {
            const { upgradePrice } = amendTransferStore;

            expect(upgradePrice).toBe(mockAmendDatesOfferWithPrice.offerPrice);
        });
    });

    describe('allowanceRestrictions', () => {
        it('should return default variant', () => {
            expect(amendTransferStore.allowanceRestrictions).toStrictEqual({ byTimeBound: false });
        });

        it('should return byTimeBound as true when booking contains AmendTransfersDisabledByTimeBound status', () => {
            (amendTransferStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.AmendTransfersDisabledByTimeBound];

            expect(amendTransferStore.allowanceRestrictions).toStrictEqual({ byTimeBound: true });
        });
    });

    describe('fetchAmendableAlternativeTransfers', () => {
        it('do nothing if there is no booking', () => {
            amendTransferStore.rootStore.viewBookingStore.booking = null;

            bookingService.getAmendTransfersWithPrice = jest.fn();
            amendTransferStore.fetchAmendableAlternativeTransfers();

            expect(bookingService.getAmendTransfersWithPrice).not.toBeCalled();
        });

        it('fetch transfers with amendment price', async () => {
            bookingService.getAmendTransfersWithPrice = jest.fn().mockReturnValue(
                Promise.resolve([
                    { transfer: privateTransfer, amendmentCharges: 100 },
                    { transfer: noTransfer, amendmentCharges: 200 },
                ]),
            );

            await amendTransferStore.fetchAmendableAlternativeTransfers();

            expect(bookingService.getAmendTransfersWithPrice).toBeCalledWith(
                'bookingReference',
                'ABCN0/LCO',
                mockBooking.package.accom,
                mockBooking.package.transport,
            );
            expect(amendTransferStore.transfersWithAmendmendCharges.length).toBe(2);
        });

        it('should reset transfers if fetching is failed', async () => {
            amendTransferStore.transfersWithAmendmendCharges = [
                { transfer: privateTransfer, amendmentCharges: 100 },
            ] as any;

            bookingService.getAmendTransfersWithPrice = jest.fn().mockReturnValue(Promise.reject());

            await amendTransferStore.fetchAmendableAlternativeTransfers();

            expect(bookingService.getAmendTransfersWithPrice).toBeCalled();
            expect(amendTransferStore.transfersWithAmendmendCharges.length).toBe(0);
        });
    });

    describe('initAmendTransfersPage', () => {
        it('should init page from payload', () => {
            amendTransferStore.rootStore.appStore.amendBookingItemPayload = {
                selectedTransfer: {},
            } as any;
            amendTransferStore.initTransfersPageFromPayload = jest.fn();

            amendTransferStore.initAmendTransfersPage();

            expect(amendTransferStore.initTransfersPageFromPayload).toBeCalled();
        });

        it('Should filled up transfersWithAmendmendCharges from amendDatesStore transfers', () => {
            amendTransferStore.scenario = AmendScenarios.FromChangeDate;
            amendTransferStore.initAmendTransfersPage();

            expect(amendTransferStore.transfersWithAmendmendCharges).toStrictEqual([mockAmendDatesOfferWithPrice]);
        });

        it('should redirect from amend transfer page', () => {
            amendTransferStore.redirectFromAmendTransfersPage = jest.fn();

            amendTransferStore.initAmendTransfersPage();

            expect(amendTransferStore.redirectFromAmendTransfersPage).toBeCalled();
        });
    });

    describe('initTransfersPageFromPayload', () => {
        it('should call viewBookingStore initBookingFromPayload and call success callback', async () => {
            amendTransferStore.fetchAmendableAlternativeTransfers = jest.fn();
            amendTransferStore.changeSelectedTransfer = jest.fn();
            amendTransferStore.changePrevSelectedTransfer = jest.fn();
            const mockPrivateTransfer = {
                transfer: { ...privateTransfer, code: 'TRANSFER_CODE' },
                amendmentCharges: 100,
            };
            amendTransferStore.transfersWithAmendmendCharges = [
                mockPrivateTransfer,
                { transfer: noTransfer, amendmentCharges: 200 },
            ];
            amendTransferStore.rootStore.appStore.amendBookingItemPayload = {
                ...mockAmendBookingPayload,
                selectedTransfer: { transfer: mockTransfer, amendmentCharges: 100 },
            };
            await amendTransferStore.initTransfersPageFromPayload();

            expect(amendTransferStore.rootStore.viewBookingStore.initBookingFromPayload).toBeCalled();
            expect(amendTransferStore.fetchAmendableAlternativeTransfers).toBeCalled();
            expect(amendTransferStore.changeSelectedTransfer).toBeCalledWith(mockPrivateTransfer);
            expect(amendTransferStore.changePrevSelectedTransfer).toBeCalledWith({
                transfer: mockTransfer,
                amendmentCharges: 100,
            });
        });
    });

    describe('redirectFromAmendTransfersPage', () => {
        it('should redirect to page from settings if it is exists', () => {
            amendTransferStore.rootStore.layoutStore.getSetting = jest
                .fn()
                .mockReturnValue({ value: { href: 'link' } });

            amendTransferStore.redirectFromAmendTransfersPage();

            expect(amendTransferStore.rootStore.routerStore.redirectTo).toBeCalledWith('link');
        });

        it('should redirect to ViewBookings page', () => {
            amendTransferStore.redirectFromAmendTransfersPage();

            expect(amendTransferStore.rootStore.routerStore.redirectTo).toBeCalledWith(SitePath.ViewBookings);
        });
    });

    describe('startToChangeTransferClick', () => {
        it('Should set scenario and redirect to appropriate page', () => {
            amendTransferStore.startToChangeTransferClick();

            expect(amendTransferStore.scenario).toBe(AmendScenarios.FromBooking);
            expect(amendTransferStore.rootStore.routerStore.redirectToAmendTransferPage).toHaveBeenCalled();
        });
    });

    describe('amendCTAState', () => {
        it('should return isVisible == false when restriction by time bound', () => {
            const spy = jest.spyOn(amendTransferStore, 'allowanceRestrictions', 'get');
            spy.mockReturnValue({ byTimeBound: true });

            expect(amendTransferStore.amendCTAState).toStrictEqual({ isVisible: false });
        });

        it('Not visible when isLoggedInAsLeadPassenger is false and have disable status', () => {
            amendTransferStore.rootStore.viewBookingStore.booking!.isLoggedInAsLeadPassenger = false;
            amendTransferStore.rootStore.viewBookingStore.booking!.amendmentInfo!.amendBookingStatus = [
                AMEND_TRANSFERS_DISABLED_STATUSES[0],
            ];

            expect(amendTransferStore.amendCTAState).toEqual({ isVisible: false });
        });

        it('Visible when transfer is eligible by Atcom', () => {
            (amendTransferStore.rootStore.viewBookingStore as any).isLeadLoggedIn = true;
            amendTransferStore.rootStore.viewBookingStore.booking!.amendmentInfo!.transfer!.amendAllow = true;

            expect(amendTransferStore.amendCTAState).toEqual({ isVisible: true });
        });

        it('Not visible when no booking', () => {
            amendTransferStore.rootStore.viewBookingStore.booking = undefined;

            expect(amendTransferStore.amendCTAState).toEqual({ isVisible: false });
        });

        it('Visible but disabled for Trade Booking', () => {
            amendTransferStore.rootStore.viewBookingStore.allowanceRestrictions.byExternalAgency = true;

            expect(amendTransferStore.amendCTAState).toEqual({ isVisible: true, isDisabled: true });
        });

        it('Visible but disabled when there is sport equipment in the booking', () => {
            amendTransferStore.rootStore.viewBookingStore.extraLuggage = {
                sportEquipmentNumber: 5,
            } as ExtraLuggage;

            expect(amendTransferStore.amendCTAState).toEqual({ isVisible: true, isDisabled: true });
        });
    });

    it('isAmendTransferEligibleByAtcom', () => {
        amendTransferStore.rootStore.viewBookingStore.booking!.amendmentInfo!.transfer!.amendAllow = true;
        expect(amendTransferStore.isAmendTransferEligibleByAtcom).toBe(true);
    });

    describe('canLoadTransfers', () => {
        it('should return false when isAmendCTADisabled is true', () => {
            jest.spyOn(amendTransferStore, 'isAmendCTADisabled', 'get').mockReturnValueOnce(true);

            expect(amendTransferStore.canLoadTransfers).toBe(false);
        });

        it('should return false when not logged in as lead passenger', () => {
            (amendTransferStore.rootStore.viewBookingStore as any).isLeadLoggedIn = false;

            expect(amendTransferStore.canLoadTransfers).toBe(false);
        });

        it('should return false when isAmendCTAVisible is false', () => {
            jest.spyOn(amendTransferStore, 'isAmendCTAVisible', 'get').mockReturnValueOnce(false);

            expect(amendTransferStore.canLoadTransfers).toBe(false);
        });

        it('should return true when all conditions are met', () => {
            jest.spyOn(amendTransferStore, 'isAmendCTADisabled', 'get').mockReturnValueOnce(false);
            jest.spyOn(amendTransferStore, 'isAmendCTAVisible', 'get').mockReturnValueOnce(true);
            (amendTransferStore.rootStore.viewBookingStore as any).isLeadLoggedIn = true;

            expect(amendTransferStore.canLoadTransfers).toBe(true);
        });
    });

    describe('totalPrice', () => {
        it('should return fullAmendmentCharges from selectedTransfer', () => {
            amendTransferStore.selectedTransfer = {
                ...mockTransfer,
                amendmentCharges: 12,
            } as any;

            expect(amendTransferStore.totalPrice).toEqual(12);
        });

        it('should return 0 if no selectedTransfer', () => {
            amendTransferStore.selectedTransfer = undefined;

            expect(amendTransferStore.totalPrice).toEqual(0);
        });
    });

    describe('promocodeBreakdown', () => {
        it('should return promoCodeBreakDown from selectedTransfer', () => {
            amendTransferStore.selectedTransfer = {
                ...mockTransfer,
                promoCodeBreakDown: mockPromoCodeBreakdown,
            } as any;

            expect(amendTransferStore.promocodeBreakdown).toEqual(mockPromoCodeBreakdown);
        });

        it('should return undefined if no selectedTransfer', () => {
            amendTransferStore.selectedTransfer = undefined;

            expect(amendTransferStore.promocodeBreakdown).toBeUndefined();
        });
    });
});
