import { stringToTitleCase } from 'frontend/utils/string.utils';
import { levenshteinDistance } from 'frontend/utils/validation.utils';
import { GuestToEdit } from 'models/data/GuestToEdit';
import { IValidationError } from 'models/data/validation/IValidationError';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { IAmendPassengersFields } from 'frontend/components/renderings/AmendPassengers/AmendPassengers';

interface IGetPassengerParameters {
    icon: ISitecoreField<ISitecoreImage>;
    newName: string;
    noTitleName: string;
    prevName: string;
    age?: string;
    subtitle?: string;
}

export const getPassengerParameters = (
    guestToEdit: GuestToEdit,
    fields: Nullable<IAmendPassengersFields>,
    infantLabel: string,
    adultAgeLabel: string,
): IGetPassengerParameters => {
    let prevName, newName, noTitleName, icon, age, subtitle;

    const getPassangerName = (amended?: boolean, withoutTitle?: boolean) => {
        const target = amended ? guestToEdit.editedDetails : guestToEdit.initialDetails;

        return `${(!withoutTitle && target.title?.concat(' ')) || ''}${target.firstName || ''}  ${
            target.lastName || ''
        }`;
    };

    if (guestToEdit.initialDetails.age < 2) {
        prevName = noTitleName = getPassangerName(false, true);
        newName = getPassangerName(true, true);
        icon = fields?.InfantIcon;
        subtitle = stringToTitleCase(infantLabel);
    } else {
        prevName = getPassangerName(false, false);
        newName = getPassangerName(true, false);
        noTitleName = getPassangerName(false, true);

        if (guestToEdit.initialDetails.age >= 18) {
            age = adultAgeLabel;
            icon = fields?.AdultIcon;
        } else {
            age = guestToEdit.initialDetails.age;
            icon = fields?.ChildIcon;
        }
    }

    return { prevName, newName, noTitleName, icon, age, subtitle };
};

export const updateRemainingCharactersToChange = (
    nameValidationErrors: IValidationError[],
    surnameValidationErrors: IValidationError[],
    setRemainingCharactersToChange: (data: number) => void,
    characterCountLimit: number,
    guestToEdit: GuestToEdit,
): void => {
    const fullName = `${guestToEdit.initialDetails.firstName} ${guestToEdit.initialDetails.lastName}`;
    const tempFullName = `${guestToEdit.tempName} ${guestToEdit.tempSurname}`;
    const distance = levenshteinDistance(fullName, tempFullName);

    setRemainingCharactersToChange(characterCountLimit - distance);
};
