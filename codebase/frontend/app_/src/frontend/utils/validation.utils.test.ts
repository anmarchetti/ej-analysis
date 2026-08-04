import { ValidationConfig } from 'code/validation.config';

import { checkIfEmailValid, getValidatorRule, levenshteinDistance, luhnValidation, validate } from './validation.utils';

class TestClass {
    @validate(ValidationConfig.required)
    testProp: string;
}

describe('validation.utils', () => {
    describe('validate, getValidatorRule', () => {
        test('should return validation rule', () => {
            const testClass = new TestClass();

            const rules = getValidatorRule(testClass, 'testProp');

            expect(rules).toEqual(ValidationConfig.required);
        });
    });

    describe('luhnValidation', () => {
        test('should return true if card number is valid', () => {
            expect(luhnValidation('5018200195671768')).toBeTruthy();
        });

        test('should return false if card number is invalid', () => {
            expect(luhnValidation('5018200195671761')).toBeFalsy();
        });
    });

    describe('checkIfEmailValid', () => {
        test('should return true if email is valid', () => {
            expect(checkIfEmailValid('example@example.com')).toBeTruthy();
        });

        test('should return false if email is invalid', () => {
            expect(checkIfEmailValid('example@example')).toBeFalsy();
        });
    });

    describe('levensteinDistance', () => {
        test('should return 0 if strings are equal', () => {
            expect(levenshteinDistance('test', 'test')).toBe(0);
        });

        test('should return 1 if second string is missing last character', () => {
            expect(levenshteinDistance('test', 'tes')).toBe(1);
        });

        test('should return 1 if second string has one extra character', () => {
            expect(levenshteinDistance('test', 'testt')).toBe(1);
        });

        test('should return length of second string if first string is empty', () => {
            expect(levenshteinDistance('', 'test')).toBe(4);
        });

        test('should return length of first string if second string is totally different', () => {
            expect(levenshteinDistance('test', 'abc')).toBe(4);
        });

        test('should return 3 if 3 of 4 characters are different', () => {
            expect(levenshteinDistance('test', 'peta')).toBe(3);
        });
    });
});
