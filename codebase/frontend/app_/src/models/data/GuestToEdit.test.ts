import { waitFor } from '@testing-library/dom';

import { mockGuests as guests } from 'frontend/__mocks__';
import AxiosRequest from 'frontend/utils/request';
import { GuestToEdit } from 'models/data/GuestToEdit';

import { IGuestPassenger } from './ILeadPassenger';

jest.mock('frontend/utils/request');

(AxiosRequest.post as jest.Mock).mockResolvedValue({
    data: {},
});

describe('GuestToEdit', () => {
    const submitEvent = {
        preventDefault: jest.fn(),
    };

    const guestParams: [IGuestPassenger, string] = [guests[0], '123456'];

    it('should initialize the class', () => {
        const guestToEdit = new GuestToEdit(...guestParams);
        expect(guestToEdit).toBeDefined();
    });

    it('editName should change tempName', () => {
        const guestToEdit = new GuestToEdit(...guestParams);
        guestToEdit.editName('newName');
        expect(guestToEdit.tempName).toEqual('newName');
    });

    it('editSurname should change tempSurname', () => {
        const guestToEdit = new GuestToEdit(...guestParams);
        guestToEdit.editSurname('newSurname');
        expect(guestToEdit.tempSurname).toEqual('newSurname');
    });

    it('openCard should change isSelected to true', () => {
        const guestToEdit = new GuestToEdit(...guestParams);
        guestToEdit.openCard();
        expect(guestToEdit.isSelected).toEqual(true);
    });

    it('closeCard should change isSelected to false', () => {
        const guestToEdit = new GuestToEdit(...guestParams);

        guestToEdit.editName(guests[1].firstName);
        guestToEdit.editSurname(guests[1].lastName);

        expect(guestToEdit.tempName).toEqual(guests[1].firstName);
        expect(guestToEdit.tempSurname).toEqual(guests[1].lastName);

        guestToEdit.closeCard();

        expect(guestToEdit.isSelected).toEqual(false);
        expect(guestToEdit.tempName).toEqual(guestParams[0].firstName);
        expect(guestToEdit.tempSurname).toEqual(guestParams[0].lastName);
    });

    it('saveCard should update isCheckPending, errorCode and isSaveFailed and call checkForAmendPossibility', () => {
        const guestToEdit = new GuestToEdit(...guestParams);
        const checkForAmendPossibilitySpy = jest.spyOn(guestToEdit, 'checkForAmendPossibility');
        guestToEdit.saveCard(submitEvent as any);

        expect(guestToEdit.isCheckPending).toEqual(true);
        expect(guestToEdit.error).toBeNull();

        waitFor(() => {
            expect(guestToEdit.isSelected).toEqual(false);
            expect(checkForAmendPossibilitySpy).toHaveBeenCalled();
            expect(guestToEdit.isCheckPending).toEqual(false);
        });
    });

    it('checkForAmendPossibility error should change errorCode to error', () => {
        const error = {
            code: '1234',
            status: 400,
        };
        (AxiosRequest.post as jest.Mock).mockRejectedValueOnce({
            response: error,
        });

        const guestToEdit = new GuestToEdit(...guestParams);
        guestToEdit.editedDetails.firstName = 'newName';

        guestToEdit.saveCard(submitEvent as any);

        waitFor(() => {
            expect(guestToEdit.error).toEqual(error);
        });
    });

    it('isEdited should return true if tempName or tempSurname is different than initialDetails', () => {
        const guestToEdit = new GuestToEdit(...guestParams);
        guestToEdit.tempName = 'newName';
        expect(guestToEdit.isEdited).toEqual(true);

        guestToEdit.tempName = 'Ann';
        guestToEdit.tempSurname = 'newSurname';
        expect(guestToEdit.isEdited).toEqual(true);

        guestToEdit.tempName = 'Ann';
        guestToEdit.tempSurname = 'Brown';
        expect(guestToEdit.isEdited).toEqual(false);
    });

    it('canBeChanged should default to true', () => {
        const guestToEdit = new GuestToEdit(...guestParams);
        expect(guestToEdit.canChangeName).toEqual(true);
    });

    it('canBeChanged should be set to false if canChangeName is false', () => {
        const guestToEdit = new GuestToEdit(...guestParams, false);
        expect(guestToEdit.canChangeName).toEqual(false);
    });
});
