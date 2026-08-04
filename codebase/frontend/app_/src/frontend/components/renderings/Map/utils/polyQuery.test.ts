import { IPolyBounds } from 'models/data/map/IMap';

import { getPolyQuery } from './polyQuery';

describe('getPolyQuery', () => {
    it('should return correct query for polygon bounds', () => {
        const polygon: IPolyBounds = { lt1: '10', lt2: '20', ln1: '30', ln2: '40' };

        const result = getPolyQuery(polygon);

        expect(result).toBe('10,30|10,40|20,40|20,30');
    });
});
