import { IBaseHolidayProduct } from 'models/data/tracking/IProduct';

import { getEcommerceProductFromBaseProduct } from './boardsAndRooms.utils';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: jest.fn().mockReturnValue('AltRoomsTitle'),
    },
}));

describe('TrackingStore.utils', () => {
    describe('getEcommerceProductFromBaseProduct', () => {
        const mockObj = {
            dimension13: 'dimension13',
            dimension15: 15,
            dimension79: 'dimension79',
        };

        it('Should filter incoming object for necessary fields', () => {
            const result = getEcommerceProductFromBaseProduct(mockObj as IBaseHolidayProduct);

            expect(result.dimension81).toBeUndefined();
            expect(result.dimension15).toBe(15);
            expect(result.dimension13).toBe('dimension13');
        });
    });
});
