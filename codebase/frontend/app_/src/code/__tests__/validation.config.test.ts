import { buildCreatePasswordValidationRules, ValidationConfig } from 'code/validation.config';
import { ValidationRule } from 'models/enum/ValidationRule';

describe('validation.config', () => {
    describe('buildCreatePasswordValidationRules()', () => {
        it('Should returns rules without prohibitedWords rule if words list is empty', () => {
            const rules = buildCreatePasswordValidationRules([]);

            expect(rules).toHaveLength(ValidationConfig.createPassword.length);
            expect(rules).toEqual(
                expect.not.arrayContaining([expect.objectContaining({ type: ValidationRule.ProhibitedWords })]),
            );
        });

        it('Should returns rules with prohibitedWords rule', () => {
            const rules = buildCreatePasswordValidationRules(['password']);

            expect(rules).toHaveLength(ValidationConfig.createPassword.length + 1);
            expect(rules).toEqual(
                expect.arrayContaining([expect.objectContaining({ type: ValidationRule.ProhibitedWords })]),
            );
        });
    });

    describe('ValidationConfig', () => {
        describe('title', () => {
            const titleValue = ValidationConfig.title[1].value;

            it('should return true when value is Mr, Miss, MRS, MS', () => {
                expect(titleValue.test('Mr')).toBe(true);
                expect(titleValue.test('Miss')).toBe(true);
                expect(titleValue.test('MRS')).toBe(true);
                expect(titleValue.test('MS')).toBe(true);
            });

            it('should return false when value is NOT Mr, Miss, MRS, MS', () => {
                expect(titleValue.test('Dr')).toBe(false);
                expect(titleValue.test('Not Applicable')).toBe(false);
                expect(titleValue.test('')).toBe(false);
            });
        });
    });
});
