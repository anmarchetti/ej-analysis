import validationService from 'frontend/services/validation.service';
import { PricePromiseInfoFields } from 'models/data/PricePromiseInfo';

import { mockPricePromiseFields } from './__mocks__/pricePromiseFields.mock';
import { getCheckBoxes, getFieldLabel, isFieldRequired } from './pricePromise.utils';

describe('pricePromise.utils', () => {
    describe('isFieldRequired', () => {
        it('should call validationService.isFieldRequired with correct arguments', () => {
            validationService.isFieldRequired = jest.fn().mockReturnValue(false);
            const store = {
                pricePromiseInfo: {},
            } as any;
            isFieldRequired(PricePromiseInfoFields.SameFlightsCheckbox, store);
            expect(validationService.isFieldRequired).toHaveBeenCalledWith(
                store.pricePromiseInfo,
                PricePromiseInfoFields.SameFlightsCheckbox,
            );
        });
    });

    describe('getFieldLabel', () => {
        it('should append asterisk for required fields', () => {
            expect(getFieldLabel('Test Label', true)).toBe('Test Label *');
        });

        it('should not append asterisk for non-required fields', () => {
            expect(getFieldLabel('Test Label', false)).toBe('Test Label');
        });
    });

    describe('getCheckBoxes', () => {
        it('should include DifferentCompanyCheckbox when ShowABTAMembershipCheckbox is true', () => {
            const fieldsWithAbta = { ...mockPricePromiseFields, ShowABTAMembershipCheckbox: { value: true } };
            const result = getCheckBoxes(fieldsWithAbta);
            expect(result[0]).toEqual({
                checkbox: PricePromiseInfoFields.DifferentCompanyCheckbox,
                label: fieldsWithAbta.DifferentCompanyLabel.value,
            });
        });

        it('should NOT include DifferentCompanyCheckbox when ShowABTAMembershipCheckbox is false', () => {
            const fieldsWithAbta = { ...mockPricePromiseFields, ShowABTAMembershipCheckbox: { value: false } };
            const result = getCheckBoxes(fieldsWithAbta);
            expect(result.find(cb => cb.checkbox === PricePromiseInfoFields.DifferentCompanyCheckbox)).toBeUndefined();
        });

        it('should include all other checkboxes with correct labels', () => {
            const result = getCheckBoxes(mockPricePromiseFields);
            expect(result).toEqual([
                {
                    checkbox: PricePromiseInfoFields.DifferentCompanyCheckbox,
                    label: mockPricePromiseFields.DifferentCompanyLabel.value,
                },
                {
                    checkbox: PricePromiseInfoFields.SameDatesOfTravelCheckbox,
                    label: mockPricePromiseFields.SameDatesOfTravelLabel.value,
                },
                {
                    checkbox: PricePromiseInfoFields.SameFlightsCheckbox,
                    label: mockPricePromiseFields.SameFlightsLabel.value,
                },
                {
                    checkbox: PricePromiseInfoFields.SamePartyCompositionCheckbox,
                    label: mockPricePromiseFields.SamePartyCompositionLabel.value,
                },
                {
                    checkbox: PricePromiseInfoFields.SameRoomTypeCheckbox,
                    label: mockPricePromiseFields.SameRoomTypeAndBoardBasisLabel.value,
                },
                {
                    checkbox: PricePromiseInfoFields.InclusiveOn23kgCheckbox,
                    label: mockPricePromiseFields.InclusiveOn23kgBagLabel.value,
                },
                {
                    checkbox: PricePromiseInfoFields.BookedWithinLast24hCheckbox,
                    label: mockPricePromiseFields.BookedWithinLast24hLabel.value,
                },
                {
                    checkbox: PricePromiseInfoFields.InclusiveOfTransfersCheckbox,
                    label: mockPricePromiseFields.InclusiveOfTransfersLabel.value,
                },
            ]);
        });
    });
});
