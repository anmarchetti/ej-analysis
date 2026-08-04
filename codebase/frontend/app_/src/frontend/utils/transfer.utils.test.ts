import {
    mockAltNoTransfer,
    mockAltPrivateTransfer,
    mockAltSharedTransfer,
    mockAltTransfer,
    mockLivePrice,
} from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { ITransfer } from 'models/data/ITransfer';

import { getNoTransfer, getTransferFromLivePriceAndOffer, isTransferHidden } from './transfer.utils';

describe('transfer.utils', () => {
    describe('isTransferHidden', () => {
        it('should return false if no transfers', () => {
            const res = isTransferHidden(null);
            expect(res).toBeFalsy();
        });

        it('should return true if any transfers fround with hidden property', () => {
            const res = isTransferHidden([
                {
                    isHidden: true,
                } as ITransfer,
                {
                    isHidden: false,
                } as ITransfer,
            ]);
            expect(res).toBeTruthy();
        });

        it('should return false if no transfers fround with hidden property', () => {
            const res = isTransferHidden([
                {
                    isHidden: false,
                } as ITransfer,
                {
                    isHidden: false,
                } as ITransfer,
            ]);
            expect(res).toBeFalsy();
        });
    });

    describe('getNoTransfer', () => {
        it('should return No Transfer element when it is exist in alternative transfers', () => {
            const result = getNoTransfer(mockAltTransfer);

            expect(result).toEqual(mockAltNoTransfer);
        });

        it('should return undefined when No Transfer element absent in alternative transfers', () => {
            const result = getNoTransfer([mockAltSharedTransfer, mockAltPrivateTransfer]);

            expect(result).toBeUndefined();
        });
    });

    describe('getTransferFromLivePriceAndOffer', () => {
        it('should return transfer from livePrice when livePrice transfer is provided', () => {
            const result = getTransferFromLivePriceAndOffer(mockLivePrice, mockedOffer);

            expect(result).toEqual(mockLivePrice.transfers[0]);
        });

        it('should return transfer from offer when livePrice is NOT provided and offer is provided', () => {
            const result = getTransferFromLivePriceAndOffer(null, mockedOffer);

            expect(result).toEqual(mockedOffer.transfers[0]);
        });

        it('should return null when livePrice and offer.transfers are NOT provided', () => {
            mockedOffer.transfers = [];
            const result = getTransferFromLivePriceAndOffer(null, mockedOffer);

            expect(result).toEqual(null);
        });
    });
});
