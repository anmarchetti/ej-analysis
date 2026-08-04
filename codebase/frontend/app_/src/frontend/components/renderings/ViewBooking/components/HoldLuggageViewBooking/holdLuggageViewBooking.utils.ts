import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IExtraLuggageContentWithPrice, ILuggageInfoItem } from 'models/data/IFlightExtras';
import { ILuggageItem } from 'frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails';
import { IViewBookingFields } from 'frontend/components/renderings/ViewBooking/ViewBooking';

export const formatLuggageItems = (
    selectedItems: Record<string, IExtraLuggageContentWithPrice>[],
    defaultBag: ILuggageInfoItem | undefined,
    infantsNumber: number,
    sportItemsTotalCount: number,
    additionalFields: IViewBookingFields,
    shouldIncludeOnlyBasicLuggage: boolean,
    defaultBagsNumber: number,
): ILuggageItem[] => {
    const { Name, Icon, Limit, Storage, LuggageIcon, SportsEquipmentTitle, SportsEquipmentIcon } = additionalFields;
    const result: ILuggageItem[] = [];

    if (infantsNumber > 0) {
        result.push({
            name: Name?.value,
            description: Storage?.value,
            icon: Icon,
            quantity: infantsNumber,
        });
    }

    if (defaultBag) {
        const { name } = defaultBag;
        const kgAmount = name.match(/\d+/g);

        result.push({
            name,
            description: `${Tokenizer.replaceToken(Limit?.value, Tokens.Number, String(kgAmount))} ${Storage?.value}`,
            icon: LuggageIcon,
            quantity: defaultBagsNumber,
        });
    }

    if (shouldIncludeOnlyBasicLuggage) {
        return result;
    }

    Object.values(selectedItems[0]).forEach(item => {
        const { name, quantity } = item;
        const kgAmount = name.match(/\d+/g);

        result.push({
            name,
            description: `${Tokenizer.replaceToken(Limit?.value, Tokens.Number, String(kgAmount))} ${Storage?.value}`,
            icon: LuggageIcon,
            quantity,
        });
    });

    const sportLuggageLines: string[] = [];

    Object.values(selectedItems[1]).forEach(item => {
        sportLuggageLines.push(`${item.name} x ${item.quantity}`);
    });

    if (sportItemsTotalCount) {
        result.push({
            name: SportsEquipmentTitle?.value,
            description: `${sportLuggageLines.join(', ')}. ${Storage?.value}`,
            icon: SportsEquipmentIcon,
            quantity: sportItemsTotalCount,
        });
    }

    return result;
};
