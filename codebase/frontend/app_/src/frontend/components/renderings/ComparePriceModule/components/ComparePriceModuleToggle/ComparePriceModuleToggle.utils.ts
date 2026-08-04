import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IComparePriceModuleFields } from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceContent/ComparePriceContent.utils';

export interface IComparePriceLabels {
    cheapestRoomLabel: string;
    keepRoomLabel: string;
}

export const getComparePriceLabels = (
    selectedOffer: IOfferWithoutAltBoards | null | undefined,
    fields?: IComparePriceModuleFields,
): IComparePriceLabels => {
    const roomCount = selectedOffer?.accom?.unit?.length ?? 0;
    const usesPluralLabels = roomCount > 1;

    const keepRoomSingular = fields?.KeepRoomSingularLabel?.value ?? '';
    const keepRoomPlural = fields?.KeepRoomPluralLabel?.value ?? '';
    const cheapestRoomSingular = fields?.CheapestRoomSingularLabel?.value ?? '';
    const cheapestRoomPlural = fields?.CheapestRoomPluralLabel?.value ?? '';

    return {
        keepRoomLabel: usesPluralLabels ? keepRoomPlural : keepRoomSingular,
        cheapestRoomLabel: usesPluralLabels ? cheapestRoomPlural : cheapestRoomSingular,
    };
};
