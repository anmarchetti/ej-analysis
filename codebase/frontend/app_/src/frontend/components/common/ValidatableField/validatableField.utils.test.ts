import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import * as dateUtils from 'frontend/utils/date.utils';
import { ValidationType } from 'models/enum/ValidationType';

import { getErrorText } from './validatableField.utils';

jest.mock('dayjs', () => ({
    ...jest.requireActual('dayjs'),
    Ls: {
        en: {
            formats: {
                L: 'dd/mm/yyyy',
            },
        },
    },
    locale: () => 'en',
}));

describe('getErrorText', () => {
    const getPhrase = p => p;
    const standardErrorFields = {
        trigger: ValidationType.OnBlur,
        propertyName: 'test property name',
    };

    it('should return rawErrorMessage text when it exist in error object', () => {
        const error = {
            ...standardErrorFields,
            errorMessage: 'test error message',
            rawErrorMessage: 'raw error message text',
            replacedValue: 'replacedValue',
            replacedToken: Tokens.Date,
        };

        expect(getErrorText(error, getPhrase)).toBe(error.rawErrorMessage);
    });

    describe('should replacedToken when it replacedValue and replacedToken exist in error object', () => {
        const spyOnGetLocalizedFormatValue = jest.spyOn(dateUtils, 'getLocalizedFormatValue');

        it('should also localized replaced value when the value is date from list DATE_LOCALIZED_FORMATS', () => {
            const error = {
                ...standardErrorFields,
                errorMessage: 'test error message with value for replace {date}',
                replacedValue: DATE_FORMATS.inputField,
                replacedToken: Tokens.Date,
            };

            expect(getErrorText(error, getPhrase)).toBe('test error message with value for replace dd/mm/yyyy');
            expect(spyOnGetLocalizedFormatValue).toHaveBeenCalled();
        });

        it('should not localized replaced value when the value is not a date from list DATE_LOCALIZED_FORMATS', () => {
            const error = {
                ...standardErrorFields,
                errorMessage: 'test error message with value for replace {date}',
                replacedValue: 'replacedValue',
                replacedToken: Tokens.Date,
            };

            expect(getErrorText(error, getPhrase)).toBe('test error message with value for replace replacedValue');
            expect(spyOnGetLocalizedFormatValue).not.toHaveBeenCalled();
        });
    });

    it('should return phrase from sitecore dictionary when error does not have rawErrorMessage, replacedToken and replacedValue', () => {
        const error = {
            ...standardErrorFields,
            errorMessage: 'test error message',
        };

        expect(getErrorText(error, getPhrase)).toBe(error.errorMessage);
    });

    it('should return phrase from sitecore dictionary when error does not have replacedToken', () => {
        const error = {
            ...standardErrorFields,
            errorMessage: 'test error message {some token}',
            replacedValue: 'replacedValue',
        };

        expect(getErrorText(error, getPhrase)).toBe(error.errorMessage);
    });

    it('should return phrase from sitecore dictionary when error does not have replacedValue', () => {
        const error = {
            ...standardErrorFields,
            errorMessage: 'test error message {some token}',
            replacedToken: Tokens.Date,
        };

        expect(getErrorText(error, getPhrase)).toBe(error.errorMessage);
    });
});
