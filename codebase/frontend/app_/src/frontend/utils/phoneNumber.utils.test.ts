import { stripLeadingZeroForUKAndIreland, trimPhoneNumber } from './phoneNumber.utils';

describe('stripLeadingZeroForUKAndIreland', () => {
    describe('UK dialing code (+44)', () => {
        it('should remove leading zero', () => {
            expect(stripLeadingZeroForUKAndIreland('07123456789', '44')).toBe('7123456789');
        });

        it('should NOT remove zero if number does not start with 0', () => {
            expect(stripLeadingZeroForUKAndIreland('7123456789', '44')).toBe('7123456789');
        });
    });

    describe('Ireland dialing code (+353)', () => {
        it('should remove leading zero', () => {
            expect(stripLeadingZeroForUKAndIreland('0871234567', '353')).toBe('871234567');
        });
    });

    describe('other dialing codes', () => {
        it('should NOT remove leading zero for non-UK/IE dialing codes', () => {
            expect(stripLeadingZeroForUKAndIreland('0123456789', '1')).toBe('0123456789');
        });

        it('should NOT remove leading zero when dialingCode is undefined', () => {
            expect(stripLeadingZeroForUKAndIreland('07123456789', undefined)).toBe('07123456789');
        });
    });
});

describe('trimPhoneNumber', () => {
    it('should remove whitespaces, dialing code in the start and leading zero from phone', () => {
        expect(trimPhoneNumber('4407123456789', '44')).toBe('7123456789');
        expect(trimPhoneNumber(' 4407123456789', '44')).toBe('7123456789');
        expect(trimPhoneNumber(' 44 07123456789', '44')).toBe('7123456789');
        expect(trimPhoneNumber('07123456789', '44')).toBe('7123456789');
        expect(trimPhoneNumber('7123456789', '44')).toBe('7123456789');
        expect(trimPhoneNumber('123456789', '44')).toBe('123456789');
        expect(trimPhoneNumber('447123456789', '44')).toBe('7123456789');
        expect(trimPhoneNumber('4447123456789', '44')).toBe('47123456789');
        expect(trimPhoneNumber('111222', '44')).toBe('111222');
        expect(trimPhoneNumber('0111222', '44')).toBe('111222');
        expect(trimPhoneNumber('0  111222', '44')).toBe('111222');
        expect(trimPhoneNumber('044111222', '44')).toBe('44111222');
    });
});
