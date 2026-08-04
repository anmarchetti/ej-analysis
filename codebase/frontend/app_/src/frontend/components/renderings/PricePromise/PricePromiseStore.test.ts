import { Guid } from 'guid-typescript';

import offersService from 'frontend/services/offers.service';
import { PricePromiseInfo } from 'models/data/PricePromiseInfo';

import { PricePromiseStore } from './PricePromiseStore';

jest.mock('models/data/PricePromiseInfo');

describe('PricePromiseStore', () => {
    describe('isFormValid', () => {
        it('should be valid if pricePromiseInfo is valid', () => {
            (PricePromiseInfo as any).mockImplementationOnce(() => ({
                isValid: true,
            }));
            const store = new PricePromiseStore(false);

            expect(store.isFormValid).toBeTruthy();
        });

        it('should be NOT valid if pricePromiseInfo is NOT valid', () => {
            (PricePromiseInfo as any).mockImplementationOnce(() => ({
                isValid: false,
            }));
            const store = new PricePromiseStore(false);

            expect(store.isFormValid).toBeFalsy();
        });
    });

    describe('resetForm()', () => {
        it('should reset form and set new form key', () => {
            Guid.create = jest.fn().mockReturnValueOnce('id-1').mockReturnValue('id-2');

            const store = new PricePromiseStore(false);

            expect(store.formKey).toBe('id-1');

            store.resetForm();

            expect(store.forceErrors).toBeFalsy();
            expect(PricePromiseInfo).toHaveBeenCalled();
            expect(store.formKey).toBe('id-2');
        });
    });

    describe('submitPricePromise()', () => {
        beforeAll(() => {
            (PricePromiseInfo as any).mockImplementationOnce(() => ({
                name: 'name',
                bookingReference: '123',
                departureDate: '01/01/2030',
                link: 'link',
                sameDatesOfTravel: true,
                sameFlights: true,
                samePartyComposition: true,
                sameRoomType: true,
                inclusiveOn23kg: true,
                inclusiveOfTransfers: true,
                screenshots: [new Blob()],
            }));
        });

        it('should successful submit form', async () => {
            offersService.sendPricePromise = jest.fn().mockResolvedValueOnce(true);
            const store = new PricePromiseStore(false);
            const resetFormMock = jest.spyOn(store, 'resetForm');

            await store.submitPricePromise();

            expect(offersService.sendPricePromise).toHaveBeenCalled();
            expect(resetFormMock).toHaveBeenCalled();
            expect(store.isSuccessMessageShown).toBeTruthy();
            expect(store.isPricePromiseFailed).toBeFalsy();
        });

        it('should failed submit form', async () => {
            offersService.sendPricePromise = jest.fn().mockRejectedValueOnce(new Error());
            const store = new PricePromiseStore(false);

            await store.submitPricePromise();

            expect(store.isSuccessMessageShown).toBeFalsy();
            expect(store.isPricePromiseFailed).toBeTruthy();
        });
    });

    describe('toggleForceErrors()', () => {
        it('should set true', () => {
            const store = new PricePromiseStore(false);
            store.toggleForceErrors(true);

            expect(store.forceErrors).toBeTruthy();
        });

        it('should set false', () => {
            const store = new PricePromiseStore(false);
            store.toggleForceErrors(false);

            expect(store.forceErrors).toBeFalsy();
        });
    });

    describe('toggleSuccessMessage()', () => {
        it('should set true', () => {
            const store = new PricePromiseStore(false);
            store.toggleSuccessMessage(true);

            expect(store.isSuccessMessageShown).toBeTruthy();
        });

        it('should set false', () => {
            const store = new PricePromiseStore(false);
            store.toggleSuccessMessage(false);

            expect(store.isSuccessMessageShown).toBeFalsy();
        });
    });
});
