import validationService from 'frontend/services/validation.service';
import { PricePromiseInfo, PricePromiseInfoFields } from 'models/data/PricePromiseInfo';

import { IPricePromiseFields } from './interfaces';
import { PricePromiseStore } from './PricePromiseStore';

export const isFieldRequired = (field: PricePromiseInfoFields, store: PricePromiseStore): boolean =>
    validationService.isFieldRequired(store.pricePromiseInfo, field as keyof PricePromiseInfo);

/** Get label and show an asterisk for mandatory field  */
export const getFieldLabel = (dictionaryItem: string, isFieldRequired: boolean): string =>
    `${dictionaryItem}${isFieldRequired ? ' *' : ''}`;

export const getCheckBoxes = (fields: IPricePromiseFields): { checkbox: PricePromiseInfoFields; label: string }[] => {
    const {
        DifferentCompanyLabel,
        SameDatesOfTravelLabel,
        SameFlightsLabel,
        SamePartyCompositionLabel,
        SameRoomTypeAndBoardBasisLabel,
        InclusiveOfTransfersLabel,
        InclusiveOn23kgBagLabel,
        BookedWithinLast24hLabel,
        ShowABTAMembershipCheckbox,
    } = fields;

    const abtaCheckbox = ShowABTAMembershipCheckbox.value
        ? [
              {
                  checkbox: PricePromiseInfoFields.DifferentCompanyCheckbox,
                  label: DifferentCompanyLabel.value,
              },
          ]
        : [];

    const baseCheckboxes = [
        {
            checkbox: PricePromiseInfoFields.SameDatesOfTravelCheckbox,
            label: SameDatesOfTravelLabel.value,
        },
        {
            checkbox: PricePromiseInfoFields.SameFlightsCheckbox,
            label: SameFlightsLabel.value,
        },
        {
            checkbox: PricePromiseInfoFields.SamePartyCompositionCheckbox,
            label: SamePartyCompositionLabel.value,
        },
        {
            checkbox: PricePromiseInfoFields.SameRoomTypeCheckbox,
            label: SameRoomTypeAndBoardBasisLabel.value,
        },
        {
            checkbox: PricePromiseInfoFields.InclusiveOn23kgCheckbox,
            label: InclusiveOn23kgBagLabel.value,
        },
        {
            checkbox: PricePromiseInfoFields.BookedWithinLast24hCheckbox,
            label: BookedWithinLast24hLabel.value,
        },
        {
            checkbox: PricePromiseInfoFields.InclusiveOfTransfersCheckbox,
            label: InclusiveOfTransfersLabel.value,
        },
    ];

    return [...abtaCheckbox, ...baseCheckboxes];
};
