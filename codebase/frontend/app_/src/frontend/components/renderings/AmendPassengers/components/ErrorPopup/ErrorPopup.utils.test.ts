import { ApiErrors } from 'models/enum/ApiErrors';

import { getErrorPopupMeta } from './ErrorPopup.utils';

const fields = {
    ErrorPopupTitle: { value: 'Error' },
    ErrorPopupSubtext: { value: 'Error subtext' },
    ErrorPopupIcon: {
        value: {
            src: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
        },
    },
    RestrictionsPopupTitle: { value: 'Change error' },
    ChangeLimitRestriction: { value: 'Change limit error {number}' },
    CharacterLimitRestriction: { value: 'Character limit error {charactersCount}' },
    LeadPassengerRestriction: { value: 'Lead passenger error' },
    RemovePassengerRestriction: { value: 'Remove passenger error' },
    Phone: { value: '12345' },
} as any;

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('ErrorPopup.utils', () => {
    describe('Should return data for getErrorPopupMeta type', () => {
        it('Generic error', () => {
            const { title, description, icon } = getErrorPopupMeta('Generic', fields, {
                charactersChangeCount: '3',
            });
            expect(title.value).toBe('Error');
            expect(icon.value.src).toBe(
                'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
            );
            expect(description.value).toBe('Error subtext');
        });

        it('Should return data for  ApiErrors.ChangeLimitExeeded  type', () => {
            const { title, description, icon } = getErrorPopupMeta(ApiErrors.ChangeLimitExeeded, fields, {
                charactersChangeCount: '3',
            });

            expect(title.value).toBe('Change error');
            expect(icon).toBeNull();
            expect(description.value).toBe("Change limit error <a class='btn-txt' href='tel:12345'>12345</a>");
        });

        it('Should return data for ApiErrors.ChangeLimitExeeded type with no phone number', () => {
            const { title, description, icon } = getErrorPopupMeta(
                ApiErrors.ChangeLimitExeeded,
                {
                    ...fields,
                    Phone: null,
                },
                {
                    charactersChangeCount: '3',
                },
            );

            expect(title.value).toBe('Change error');
            expect(icon).toBeNull();
            expect(description.value).toBe('Change limit error');
        });

        it('Should return data for ApiErrors.CharactersChangeLimitExeeded type', () => {
            const { title, description, icon } = getErrorPopupMeta(ApiErrors.CharactersChangeLimitExeeded, fields, {
                charactersChangeCount: '3',
            });

            expect(title.value).toBe('Change error');
            expect(icon).toBeNull();
            expect(description.value).toBe('Character limit error 3');
        });

        it('Should return data for LeadPassengerRestriction type', () => {
            const { title, description, icon } = getErrorPopupMeta('LeadPassengerRestriction', fields, {
                charactersChangeCount: '3',
            });

            expect(title.value).toBe('Change error');
            expect(icon).toBeNull();
            expect(description.value).toBe('Lead passenger error');
        });

        it('Should return data for RemovePassengerRestriction type', () => {
            const { title, description, icon } = getErrorPopupMeta('RemovePassengerRestriction', fields, {
                charactersChangeCount: '3',
            });

            expect(title.value).toBe('Change error');
            expect(icon).toBeNull();
            expect(description.value).toBe('Remove passenger error');
        });

        it('Should return data for no error description', () => {
            const { title, description, icon } = getErrorPopupMeta('AnyError' as any, fields, {
                charactersChangeCount: '3',
            });

            expect(title).toBe(undefined);
            expect(icon).toBeNull();
            expect(description.value).toBe('');
        });
    });
});
