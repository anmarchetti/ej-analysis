import { GuestType } from 'models/enum/GuestType';
import { DEFAULT_AGE } from 'models/RoomAllocation';

import {
    createAdultDetails,
    getNumberOfGuestsByCategory,
    isInfantsPerAdultQuantityReached,
    isInfantsPerAdultQuantityValid,
    validateChildrenAgesInRoom,
} from './guestsValidation';

describe('guestsValidation', () => {
    describe('isInfantsPerAdultQuantityReached', () => {
        it('should return true if there is 1 infant per 1 adult otherwise false', () => {
            expect(isInfantsPerAdultQuantityReached(5, 5)).toBeTruthy();
            expect(isInfantsPerAdultQuantityReached(2, 5)).toBeFalsy();
        });
    });

    describe('isInfantsPerAdultQuantityValid', () => {
        it('should return true if thers no more then 1 infant per 1 adult', () => {
            expect(isInfantsPerAdultQuantityValid(5, 5)).toBeTruthy();
            expect(isInfantsPerAdultQuantityValid(2, 6)).toBeTruthy();
            expect(isInfantsPerAdultQuantityValid(7, 3)).toBeFalsy();
        });
    });

    describe('validateChildrenAgesInRoom', () => {
        it('should return false if children empty', () => {
            expect(validateChildrenAgesInRoom([])).toBeFalsy();
        });

        it('should return true if children age < 2', () => {
            expect(validateChildrenAgesInRoom([{ age: 0 } as any])).toBeTruthy();
        });

        it('should return true if children age > 15', () => {
            expect(validateChildrenAgesInRoom([{ age: 0 } as any])).toBeTruthy();
        });

        it('should return false if children age valid', () => {
            expect(validateChildrenAgesInRoom([{ age: 0 } as any])).toBeTruthy();
        });
    });

    describe('createAdultDetails', () => {
        it('should create adult with default info', () => {
            const res = createAdultDetails();
            expect(res.age).toEqual(DEFAULT_AGE);
            expect(res.isLead).toEqual(false);
            expect(res.type).toEqual(GuestType.Adult);
            expect(res.email).toBeUndefined();
            expect(res.address).toBeUndefined();
            expect(res.city).toBeUndefined();
            expect(res.postCode).toBeUndefined();
        });

        it('should create adult with age', () => {
            const res = createAdultDetails(25);

            expect(res.age).toEqual(25);
            expect(res.isLead).toEqual(false);
            expect(res.type).toEqual(GuestType.Adult);
            expect(res.email).toBeUndefined();
            expect(res.address).toBeUndefined();
            expect(res.city).toBeUndefined();
            expect(res.postCode).toBeUndefined();
        });

        it('should create lead adult', () => {
            const res = createAdultDetails(25, true);

            expect(res.age).toEqual(25);
            expect(res.isLead).toEqual(true);
            expect(res.type).toEqual(GuestType.Adult);
            expect(res.email).toBeUndefined();
            expect(res.address).not.toBeUndefined();
            expect(res.city).not.toBeUndefined();
            expect(res.postCode).not.toBeUndefined();
        });

        it('should create lead adult for TradePortal', () => {
            const res = createAdultDetails(25, true, true);

            expect(res.age).toEqual(25);
            expect(res.isLead).toEqual(true);
            expect(res.type).toEqual(GuestType.Adult);
            expect(res.email).not.toBeUndefined();
            expect(res.address).toBeUndefined();
            expect(res.city).toBeUndefined();
            expect(res.postCode).toBeUndefined();
        });
    });

    describe('getNumberOfGuestsByCategory', () => {
        it('should return empty string adult, children and infants number is not passed', () => {
            expect(getNumberOfGuestsByCategory(p => p)).toEqual('');
        });

        it('should return adults label', () => {
            expect(getNumberOfGuestsByCategory(p => p, 2)).toEqual('2 Globals.Labels.Adults');
        });

        it('should return adults and children labels', () => {
            expect(getNumberOfGuestsByCategory(p => p, 2, 1)).toEqual(
                '2 Globals.Labels.Adults, 1 Globals.Labels.Child',
            );
        });

        it('should return adults, children and infants labels', () => {
            expect(getNumberOfGuestsByCategory(p => p, 3, 2, 1)).toEqual(
                '3 Globals.Labels.Adults, 2 Globals.Labels.Children, 1 Globals.Labels.Infant',
            );
        });
    });
});
