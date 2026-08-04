import { IBookingSpecialRequest } from 'models/data/IBookingInfo';
import { IContradictoryOptionsPayload, IFlattenedSpecialRequest } from 'models/data/SpecialRequest';

export const getSelectedRequestsCodes = (requests: IFlattenedSpecialRequest[]): string[] =>
    requests.reduce((codes, rq) => {
        if (rq.isSelected) {
            codes.push(rq.code);
        }

        return codes;
    }, [] as string[]);

export const getContradictingItems = (
    requests: IFlattenedSpecialRequest[],
    newRequestCode: string,
): Nullable<IContradictoryOptionsPayload> => {
    const newOption = requests.find(rq => rq.code === newRequestCode);
    const currentOption = requests.find(
        request =>
            request.code !== newOption?.code &&
            request.isSelected &&
            request.contradictoryGroupId &&
            request.contradictoryGroupId === newOption?.contradictoryGroupId,
    );

    if (currentOption && newOption && !newOption?.isSelected) {
        return {
            newOption,
            currentOption,
        };
    }

    return null;
};

export const isSelectedRequestsDifferFromOriginal = (
    currentRequests: IFlattenedSpecialRequest[],
    originalRequests: Array<IFlattenedSpecialRequest | IBookingSpecialRequest>,
): boolean => {
    const selectedCodes = getSelectedRequestsCodes(currentRequests);

    if (selectedCodes.length !== originalRequests.length) {
        return true;
    }

    return originalRequests.some(brq => !selectedCodes.includes(brq.code));
};
