import { updateRemainingCharactersToChange } from 'frontend/utils/AmendPassengers.utils';
import { levenshteinDistance } from 'frontend/utils/validation.utils';
import { GuestToEdit } from 'models/data/GuestToEdit';

jest.mock('frontend/utils/validation.utils', () => ({
    levenshteinDistance: jest.fn(),
}));
const mockLevenshteinDistance = levenshteinDistance as jest.Mock;

describe('updateRemainingCharactersToChange', () => {
    let setRemainingCharactersToChange;
    const characterCountLimit = 3;

    beforeEach(() => {
        setRemainingCharactersToChange = jest.fn();
        mockLevenshteinDistance.mockClear();
    });

    it('sets the correct remaining characters when there are no validation errors', () => {
        const guestToEdit = {
            initialDetails: { firstName: 'John', lastName: 'Doe' },
            tempName: 'Jon',
            tempSurname: 'Do',
        } as GuestToEdit;
        const nameValidationErrors = [];
        const surnameValidationErrors = [];

        mockLevenshteinDistance.mockReturnValue(2);

        updateRemainingCharactersToChange(
            nameValidationErrors,
            surnameValidationErrors,
            setRemainingCharactersToChange,
            characterCountLimit,
            guestToEdit,
        );

        expect(setRemainingCharactersToChange).toHaveBeenCalledWith(characterCountLimit - 2);
    });
});
