import { intersection } from 'frontend/utils/array.utils';
import { IBookingSpecialRequest } from 'models/data/IBookingInfo';

export const getSpecialRequestsGroupCodes = (specialRequests: Array<IBookingSpecialRequest> | undefined): string => {
    const uniqCodes =
        specialRequests?.reduce((result, el) => {
            if (!result.includes(el.groupCode)) {
                result.push(el.groupCode);
            }

            return result;
        }, [] as Array<string>) || [];

    return uniqCodes.join(',');
};

export const getSpecialRequestsAction = (
    oldRequestsCodes: Array<string> | undefined,
    newRequestsCodes: Array<string> | undefined,
): string | undefined => {
    const oldCodesLength = oldRequestsCodes?.length || 0;
    const newCodesLength = newRequestsCodes?.length || 0;
    const codesIntersection = intersection(oldRequestsCodes, newRequestsCodes).length;

    if (codesIntersection === oldCodesLength && oldCodesLength === newCodesLength) {
        return 'identical';
    }

    if (codesIntersection === newCodesLength && oldCodesLength > newCodesLength) {
        return 'remove';
    }

    if (codesIntersection === oldCodesLength && oldCodesLength < newCodesLength) {
        return 'add';
    }

    //when the user at the same time added new and deleted previously selected requirements
    return 'edit';
};
