import { formatGuests } from './formatGuests';

describe('formatGuests', () => {
    test('should return formated guests information for 1 2 3 combination', () => {
        const guestInfo = formatGuests(1, 2, 3);
        expect(guestInfo).toEqual('1 Adl, 2 Chld, 3 Inf');
    });

    test('should return formated guests only for adults', () => {
        const guestInfo = formatGuests(1, 0, 0);
        expect(guestInfo).toEqual('1 Adl');
    });

    test('should return formated guests only for children', () => {
        const guestInfo = formatGuests(0, 2, 0);
        expect(guestInfo).toEqual('2 Chld');
    });

    test('should return formated guests only for infants', () => {
        const guestInfo = formatGuests(0, 0, 3);
        expect(guestInfo).toEqual('3 Inf');
    });

    test('should return empty string if not guests', () => {
        const guestInfo = formatGuests(0, 0, 0);
        expect(guestInfo).toEqual('');
    });
});
