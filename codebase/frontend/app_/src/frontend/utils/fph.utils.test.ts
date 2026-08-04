import { createVerify } from 'node:crypto';

import { FlightPlusHotelQueryParamName } from 'models/enum/FlightPlusHotelQueryParamName';

import { canonicalise, validateBase64, verifyFphSignature } from './fph.utils';

jest.mock('node:crypto');

const mockedCreateVerify = createVerify as jest.MockedFn<typeof createVerify>;

const createVerifyMock = (verifyReturnValue: boolean) => {
    const verifyMock = jest.fn().mockReturnValue(verifyReturnValue);
    const updateMock = jest.fn();

    mockedCreateVerify.mockReturnValue({
        update: updateMock,
        end: jest.fn(),
        verify: verifyMock,
    } as any);

    return { verifyMock, updateMock };
};

describe('fph.utils', () => {
    describe('canonicalise', () => {
        it('should sort keys alphabetically', () => {
            expect(canonicalise({ price: '100', dPrice: '10' })).toBe('dPrice=10&price=100');
        });

        it('should encode special characters in values', () => {
            expect(canonicalise({ key: 'a b', val: 'x=y' })).toBe('key=a%20b&val=x%3Dy');
        });

        it('should handle a single key', () => {
            expect(canonicalise({ price: '100' })).toBe('price=100');
        });

        it('should return empty string for empty object', () => {
            expect(canonicalise({})).toBe('');
        });
    });

    describe('validateBase64', () => {
        it('should return true for valid base64 strings', () => {
            expect(validateBase64('AAAA')).toBe(true);
        });

        it('should return false for invalid base64 strings', () => {
            expect(validateBase64('abc%3')).toBe(false);
        });

        it('should encode special characters in values', () => {
            expect(canonicalise({ key: 'a b', val: 'x=y' })).toBe('key=a%20b&val=x%3Dy');
        });
    });

    describe('verifyFphSignature', () => {
        it('should return false when sig contains invalid base64 characters', () => {
            const query = {
                [FlightPlusHotelQueryParamName.Discount]: '15',
                [FlightPlusHotelQueryParamName.Signature]: 'abc%3',
            };

            expect(verifyFphSignature(query, 'any-key')).toBe(false);
            expect(mockedCreateVerify).not.toHaveBeenCalled();
        });

        it('should return false when sig is missing from query', () => {
            const query = {
                [FlightPlusHotelQueryParamName.Discount]: '15',
            };

            expect(verifyFphSignature(query, 'any-key')).toBe(false);
            expect(mockedCreateVerify).not.toHaveBeenCalled();
        });

        it('should normalise spaces to + in sig before verification', () => {
            const { verifyMock } = createVerifyMock(true);

            const query = {
                [FlightPlusHotelQueryParamName.Discount]: '15',
                [FlightPlusHotelQueryParamName.Signature]: 'AA AA',
            };

            verifyFphSignature(query, 'any-key');

            expect(verifyMock).toHaveBeenCalledWith('any-key', 'AA+AA', 'base64');
        });

        it('should normalise newlines in public key before verification', () => {
            const { verifyMock } = createVerifyMock(true);

            const query = {
                [FlightPlusHotelQueryParamName.Discount]: '15',
                [FlightPlusHotelQueryParamName.Signature]: 'AAAA',
            };

            verifyFphSignature(query, 'any-key\\ntest');

            expect(verifyMock).toHaveBeenCalledWith('any-key\ntest', 'AAAA', 'base64');
        });

        it('should return false when sig is empty', () => {
            const query = {
                [FlightPlusHotelQueryParamName.Discount]: '15',
                [FlightPlusHotelQueryParamName.Signature]: '',
            };

            expect(verifyFphSignature(query, 'any-key')).toBe(false);
            expect(mockedCreateVerify).not.toHaveBeenCalled();
        });

        it('should return true when verifier returns true', () => {
            createVerifyMock(true);

            const query = {
                [FlightPlusHotelQueryParamName.Discount]: '15',
                [FlightPlusHotelQueryParamName.Signature]: 'AAAA',
            };

            expect(verifyFphSignature(query, 'any-key')).toBe(true);
        });

        it('should return false when verifier returns false', () => {
            createVerifyMock(false);

            const query = {
                [FlightPlusHotelQueryParamName.Discount]: '15',
                [FlightPlusHotelQueryParamName.Signature]: 'AAAA',
            };

            expect(verifyFphSignature(query, 'any-key')).toBe(false);
        });

        it('should call verifier.update with correctly sorted canonical string', () => {
            const { updateMock } = createVerifyMock(true);

            const query = {
                [FlightPlusHotelQueryParamName.Discount]: '15',
                [FlightPlusHotelQueryParamName.Signature]: 'AAAA',
            };

            verifyFphSignature(query, 'any-key');

            expect(updateMock).toHaveBeenCalledWith('dPrice=15');
        });

        it('should call verifier.verify with correct key and signature', () => {
            const { verifyMock } = createVerifyMock(true);

            const query = {
                [FlightPlusHotelQueryParamName.Discount]: '15',
                [FlightPlusHotelQueryParamName.Signature]: 'AAAA',
            };

            verifyFphSignature(query, 'my-public-key');

            expect(verifyMock).toHaveBeenCalledWith('my-public-key', 'AAAA', 'base64');
        });

        it('should include "undefined" in canonical when dPrice is missing', () => {
            const { updateMock } = createVerifyMock(true);

            const query = {
                [FlightPlusHotelQueryParamName.Signature]: 'AAAA',
            };

            verifyFphSignature(query, 'any-key');

            expect(updateMock).toHaveBeenCalledWith('dPrice=undefined');
        });

        it('should return false when createVerify throws', () => {
            mockedCreateVerify.mockImplementation(() => {
                throw new Error('crypto error');
            });

            const query = {
                [FlightPlusHotelQueryParamName.Discount]: '15',
                [FlightPlusHotelQueryParamName.Signature]: 'AAAA',
            };

            expect(verifyFphSignature(query, 'any-key')).toBe(false);
        });
    });
});
