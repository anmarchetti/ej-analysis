import { waitFor } from '@testing-library/react';

import { createMockStores, mockAmendDatesOfferWithPrice, mockAmendDatesStore, mockTransfer } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import { getUpgradeTransferPrice } from 'frontend/store/holidays/amend/amendTransfers/AmendTransfersStore.utils';
import { AmendEventActions, AmendEventLabels } from 'models/data/tracking/AmendEvent';
import SitePath from 'models/enum/SitePath';

import { AmendDatesTransfer } from './AmendDates.transfer';

const createAmendDatesTransferStore = () =>
    new AmendDatesTransfer(
        createMockStores({
            amendDatesStore: mockAmendDatesStore,
            amendTransfersStore: {
                setScenario: jest.fn(),
            },
        }),
    );

let amendDatesTransferStore: AmendDatesTransfer;

jest.mock('frontend/services/booking.service');
jest.mock('frontend/services/logging');
jest.mock('frontend/store/holidays/amend/amendTransfers/AmendTransfersStore.utils');

describe('AmendDates.transfer store', () => {
    beforeEach(() => {
        amendDatesTransferStore = createAmendDatesTransferStore();
    });

    it('Create store with default params', () => {
        expect(amendDatesTransferStore.transferOffers.length).toBe(0);
    });

    describe('transfersWithAmendCharges', () => {
        it('Should return transfers from offers', () => {
            amendDatesTransferStore.transferOffers = [mockAmendDatesOfferWithPrice];

            expect(amendDatesTransferStore.transfersWithAmendCharges).toStrictEqual([
                {
                    amendmentCharges: 10,
                    promoCodeBreakDown: mockAmendDatesOfferWithPrice.promoCodeBreakDown,
                    transfer: mockAmendDatesOfferWithPrice.offer.transfers[0],
                },
            ]);
        });
    });

    describe('upgradePrice', () => {
        it('Should getUpgradeTransferPrice be called', () => {
            amendDatesTransferStore.transferOffers = [mockAmendDatesOfferWithPrice];

            amendDatesTransferStore.upgradePrice;

            expect(getUpgradeTransferPrice).toHaveBeenCalledWith(mockAmendDatesOfferWithPrice.offer.transfers[0], [
                {
                    amendmentCharges: 10,
                    promoCodeBreakDown: mockAmendDatesOfferWithPrice.promoCodeBreakDown,
                    transfer: mockAmendDatesOfferWithPrice.offer.transfers[0],
                },
            ]);
        });
    });

    describe('getTransferOffers', () => {
        it('Return transfer offers', async () => {
            (bookingService as any).getAmendDatesTransferOptions = jest.fn(() => [
                mockAmendDatesOfferWithPrice,
                mockAmendDatesOfferWithPrice,
            ]);

            await amendDatesTransferStore.getTransferOffers(mockAmendDatesOfferWithPrice);

            expect(bookingService.getAmendDatesTransferOptions).toHaveBeenCalled();
            expect(amendDatesTransferStore.transferOffers.length).toBe(2);
        });

        it('Catch an error', async () => {
            (logger as any).error = jest.fn();
            (bookingService as any).getAmendDatesTransferOptions = jest.fn(() => {
                throw new Error('test');
            });

            expect(amendDatesTransferStore.isError).toBe(false);
            try {
                await amendDatesTransferStore.getTransferOffers(mockAmendDatesOfferWithPrice);
            } catch (e) {
                expect(logger.error).toHaveBeenCalled();
                expect(e.message).toBe('test');
                expect(amendDatesTransferStore.isError).toBe(true);
            }

            expect(amendDatesTransferStore.transferOffers.length).toBe(0);
        });

        it('should isLoading property to be changed', async () => {
            bookingService.getAmendDatesTransferOptions = jest.fn().mockResolvedValue(mockAmendDatesOfferWithPrice);
            amendDatesTransferStore.getTransferOffers(mockAmendDatesOfferWithPrice);

            expect(amendDatesTransferStore.isLoading).toBe(true);

            await waitFor(() => expect(amendDatesTransferStore.isLoading).toBe(false));
        });
    });

    describe('clearStore', () => {
        it('Should clear store', () => {
            amendDatesTransferStore.transferOffers = [mockAmendDatesOfferWithPrice];

            amendDatesTransferStore.clearStore();

            expect(amendDatesTransferStore.transferOffers.length).toBe(0);
        });
    });

    describe('submitDateChangeTransferAmendment', () => {
        it('Did not find an offer', () => {
            const offer = { ...mockAmendDatesOfferWithPrice };
            offer.offer.transfers[0].code = 'Test Code';
            amendDatesTransferStore.rootStore.amendDatesStore.offerWithPrices = null;
            amendDatesTransferStore.transferOffers = [offer];
            amendDatesTransferStore.submitDateChangeTransferAmendment({ ...mockTransfer });

            expect(amendDatesTransferStore.rootStore.amendDatesStore.offerWithPrices).toBeNull();
        });

        it('Fill up offer and redirect', () => {
            const offer = { ...mockAmendDatesOfferWithPrice };
            offer.offer.transfers[0].code = mockTransfer.code;
            amendDatesTransferStore.transferOffers = [offer];

            amendDatesTransferStore.submitDateChangeTransferAmendment(mockTransfer);

            expect(amendDatesTransferStore.rootStore.amendDatesStore.offerWithPrices).toBeTruthy();
            expect(amendDatesTransferStore.rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                SitePath.AmendDatesSummary,
            );
        });
    });

    describe('handleChangeTransfer', () => {
        it('Set transfer scenario, track action and redirect', () => {
            amendDatesTransferStore.handleChangeTransfer();

            expect(
                amendDatesTransferStore.rootStore.trackingStore.trackGenericAmendmentActionWithGuests,
            ).toHaveBeenCalledWith(AmendEventActions.ChangeDates, AmendEventLabels.EditProducts, {
                genericValue1: AmendEventLabels.ChangeTransfers,
            });
            expect(amendDatesTransferStore.rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                SitePath.AmendTransfer,
            );
        });
    });
});
