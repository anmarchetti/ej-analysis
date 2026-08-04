import { getPassengersLuggage } from './holdLuggage.utils';

describe('holdLuggage.utils', () => {
    describe('getPassengersLuggage', () => {
        it('should return an empty array when no selected luggage', () => {
            expect(getPassengersLuggage({}, 4)).toEqual([]);
        });

        it('should return luggage per passengers array', () => {
            expect(getPassengersLuggage({ LUG: 3 }, 2)).toEqual([
                {
                    code: 'LUG',
                    passengerId: '1',
                    quantity: 1,
                },
                {
                    code: 'LUG',
                    passengerId: '2',
                    quantity: 1,
                },
                {
                    code: 'LUG',
                    passengerId: '1',
                    quantity: 1,
                },
            ]);
        });
    });
});
