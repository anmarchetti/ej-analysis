import { mockTransfer, mockTransfersWithAmendmentCharges } from 'frontend/__mocks__';
import { TransferType } from 'models/enum/transfer/TransferType';

import { getTransferTypePrice, getUpgradeTransferPrice } from './AmendTransfersStore.utils';

const privateTransfer = {
    ...mockTransfer,
    type: TransferType.Private,
};

const noTransfer = {
    ...mockTransfer,
    type: TransferType.NoTransfer,
};

const sharedTransfer = {
    ...mockTransfer,
    type: TransferType.Shared,
};

describe('AmendTransfersStore.utils', () => {
    describe('getTransferTypePrice', () => {
        it('Should return amend price by type', () => {
            const result = getTransferTypePrice(TransferType.Private, mockTransfersWithAmendmentCharges);

            expect(result).toBe(13);
        });
    });

    describe('getUpgradeTransferPrice', () => {
        it('should return 0 if no initial transfer', () => {
            const result = getUpgradeTransferPrice(undefined, mockTransfersWithAmendmentCharges);

            expect(result).toBe(0);
        });

        it('should return price for SHARED transfer if initial transfer type is NO_TRANSFER', () => {
            const result = getUpgradeTransferPrice(noTransfer, [
                { transfer: privateTransfer, amendmentCharges: 100 },
                { transfer: sharedTransfer, amendmentCharges: 200 },
            ]);

            expect(result).toEqual(200);
        });

        it('should return price for PRIVATE transfer if initial transfer type is NO_TRANSFER and thre is no SHARED transferin alternative list', () => {
            const result = getUpgradeTransferPrice(noTransfer, [{ transfer: privateTransfer, amendmentCharges: 100 }]);

            expect(result).toEqual(100);
        });

        it('should return price for PRIVATE transfer if initial transfer type is SHARED', () => {
            const result = getUpgradeTransferPrice(sharedTransfer, [
                { transfer: privateTransfer, amendmentCharges: 100 },
                { transfer: noTransfer, amendmentCharges: 300 },
            ]);

            expect(result).toEqual(100);
        });

        it('should return 0 in case for SHARED transfer and initial transfer type is PRIVATE', () => {
            const result = getUpgradeTransferPrice(privateTransfer, [
                { transfer: privateTransfer, amendmentCharges: 100 },
                { transfer: noTransfer, amendmentCharges: 300 },
            ]);

            expect(result).toEqual(0);
        });

        it('Should return 0 when no amend transfer were provided', () => {
            const result = getUpgradeTransferPrice(privateTransfer);

            expect(result).toEqual(0);
        });
    });
});
