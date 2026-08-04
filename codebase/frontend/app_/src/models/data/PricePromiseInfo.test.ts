import validationService from 'frontend/services/validation.service';

import { PricePromiseInfo, PricePromiseInfoFields } from './PricePromiseInfo';

jest.mock('code/validation.config', () => {
    const original = jest.requireActual('code/validation.config');

    return {
        ...original,
        buildCreatePasswordValidationRules: jest.fn(() => original.ValidationConfig.createPassword),
    };
});

describe('PricePromiseInfo', () => {
    let pricePromiseInfoModel: PricePromiseInfo;

    beforeEach(() => {
        pricePromiseInfoModel = new PricePromiseInfo(false);
        pricePromiseInfoModel.name = 'John';
        pricePromiseInfoModel.bookingReference = '111';
        pricePromiseInfoModel.departureDate = '2023-01-01';
        pricePromiseInfoModel.link = 'https://example.com';
        pricePromiseInfoModel.sameDatesOfTravel = false;
        pricePromiseInfoModel.sameFlights = false;
        pricePromiseInfoModel.samePartyComposition = false;
        pricePromiseInfoModel.sameRoomType = false;
        pricePromiseInfoModel.inclusiveOn23kg = false;
        pricePromiseInfoModel.differentCompany = false;
        pricePromiseInfoModel.bookedWithinLast24h = false;
        pricePromiseInfoModel.inclusiveOfTransfers = false;
        pricePromiseInfoModel.screenshots = null;
        pricePromiseInfoModel.showABTAMembershipCheckbox = true;
    });

    describe('constructor', () => {
        it('should set showABTAMembershipCheckbox to true if contractor parameter is true', () => {
            pricePromiseInfoModel = new PricePromiseInfo(true);

            expect(pricePromiseInfoModel.showABTAMembershipCheckbox).toBe(true);
        });

        it('should set showABTAMembershipCheckbox to false if contractor parameter is false', () => {
            pricePromiseInfoModel = new PricePromiseInfo(false);

            expect(pricePromiseInfoModel.showABTAMembershipCheckbox).toBe(false);
        });
    });

    describe('isValid', () => {
        it('should return true if validationService does NOT returns error', () => {
            validationService.validateModel = jest.fn().mockReturnValue([]);

            expect(pricePromiseInfoModel.isValid).toBe(true);
        });

        it('should return false if validationService  returns error', () => {
            validationService.validateModel = jest.fn().mockReturnValue([{ errorMessage: 'error' }]);

            expect(pricePromiseInfoModel.isValid).toBe(false);
        });
    });

    describe('isValidCheckboxSet', () => {
        it('should return true if all checkboxes are valid', () => {
            validationService.validateField = jest.fn().mockReturnValue([]);

            expect(pricePromiseInfoModel.isValidCheckboxSet).toBe(true);
        });

        it('should return false if one of checkbox are NOT valid', () => {
            validationService.validateField = jest
                .fn()
                .mockReturnValue([])
                .mockReturnValueOnce([{ errorMessage: 'error' }]);

            expect(pricePromiseInfoModel.isValidCheckboxSet).toBe(false);
        });
    });

    describe('isValidField', () => {
        it('should return true if validationService does NOT returns error', () => {
            validationService.validateField = jest.fn().mockReturnValue([]);

            expect(pricePromiseInfoModel.isValidField(PricePromiseInfoFields.Name)).toBe(true);
        });

        it('should return false if validationService returns error', () => {
            validationService.validateField = jest.fn().mockReturnValue([{ errorMessage: 'error' }]);

            expect(pricePromiseInfoModel.isValidField(PricePromiseInfoFields.Name)).toBe(false);
        });
    });

    describe('validateField', () => {
        it('should return validation errors from validationService', () => {
            const errors = [{ errorMessage: 'error' }];
            validationService.validateField = jest.fn().mockReturnValue(errors);

            expect(pricePromiseInfoModel.validateField(PricePromiseInfoFields.Name)).toEqual(errors);
        });
    });

    describe('onChangeField', () => {
        it('should update the field value', () => {
            pricePromiseInfoModel.onChangeField(PricePromiseInfoFields.Name, 'Jane');

            expect(pricePromiseInfoModel.name).toBe('Jane');
        });
    });
});
