import { isDotcomQuery } from './isDotcomQuery';

describe('isDotcomQuery', () => {
    it('returns true only when we have destinations, departure_airports, dd, rd query params', () => {
        const query = {
            destinations: 'destinations',
            departure_airports: 'departure_airports',
            dd: 'dd',
            rd: 'rd',
        } as qs.ParsedQs;

        const result = isDotcomQuery(query);

        expect(result).toBe(true);
    });

    it.each([
        { departure_airports: 'departure_airports', dd: 'dd', rd: 'rd' },
        {
            destinations: 'destinations',
            dd: 'dd',
            rd: 'rd',
        },
        {
            destinations: 'destinations',
            departure_airports: 'departure_airports',
            rd: 'rd',
        },
        {
            destinations: 'destinations',
            departure_airports: 'departure_airports',
            dd: 'dd',
        },
    ])('returns false when one of query params missing', query => {
        const result = isDotcomQuery(query);

        expect(result).toBe(false);
    });

    it('returns false for empty query object', () => {
        const query = {} as qs.ParsedQs;
        const result = isDotcomQuery(query);

        expect(result).toBe(false);
    });
});
