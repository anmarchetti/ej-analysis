import { useEffect, useState } from 'react';

import isBackend from 'frontend/utils/isBackend';
import { getWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import {
    IFlattenedSpecialRequest,
    ISpecialRequestContradictoryGroup,
    ISpecialRequestsType,
} from 'models/data/SpecialRequest';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { useIsMounted } from './useIsMounted';
import useStore from './useStore';

export const getAllSpecialRequests = (
    types: ISpecialRequestsType[],
    selectedCodes: string[] = [],
    hasInfant: boolean = false,
    ignoredCodes: string[] = [],
    contradictoryGroups?: ISpecialRequestContradictoryGroup[],
): [IFlattenedSpecialRequest[], string[]] => {
    const requests: IFlattenedSpecialRequest[] = [];
    const preselectedCodes: string[] = [];

    types.forEach(type => {
        type.fields?.SpecialRequests?.forEach(request => {
            const item: IFlattenedSpecialRequest = {
                code: request.fields?.Code?.value,
                groupCode: type.fields?.Code?.value,
                name: request.fields?.DisplayName?.value,
                isSelected: selectedCodes.includes(request.fields?.Code?.value),
            };

            if (hasInfant && request.fields?.PreSelectedForInfant?.value && !ignoredCodes.includes(item.code)) {
                item.isPreselected = true;
                item.preselectedAlert = request.fields?.PreSelectedForInfantAlert;
                item.AlertTitle = request.fields?.AlertTitle;

                preselectedCodes.push(item.code);
            }

            contradictoryGroups?.forEach(contGroup => {
                if (contGroup?.fields?.Options?.some(contrElement => contrElement?.fields?.Code?.value === item.code)) {
                    item.contradictoryGroupId = contGroup.id;
                }
            });

            if (!!item.code && !!item.name) {
                requests.push(item);
            }
        });
    });

    // Place preselected requests at the beginning
    if (preselectedCodes.length > 0) {
        requests.sort((a, b) => {
            if (a.isPreselected && !b.isPreselected) {
                return -1;
            }

            if (!a.isPreselected && b.isPreselected) {
                return 1;
            }

            return 0;
        });
    }

    return [requests, preselectedCodes];
};

// Add Preselected codes to ignored, so they are not preselected on the next page opening
export const addPreselectedToIgnored = (codes: string[], packageId: string): void => {
    let currentIgnored = getWebStorageItem(WebStorageKeys.IgnoredPreselectedRequests, true, sessionStorage);

    if (currentIgnored && typeof currentIgnored === 'object') {
        if (currentIgnored[packageId] && Array.isArray(currentIgnored[packageId])) {
            currentIgnored[packageId].push(...codes);
        } else {
            currentIgnored[packageId] = codes;
        }
    } else {
        currentIgnored = {
            [packageId]: codes,
        };
    }

    setWebStorageItem(WebStorageKeys.IgnoredPreselectedRequests, currentIgnored, sessionStorage);
};

export const getIgnoredCodes = (packageId: string): string[] => {
    const currentIgnored = isBackend()
        ? {}
        : getWebStorageItem(WebStorageKeys.IgnoredPreselectedRequests, true, sessionStorage);

    if (
        currentIgnored &&
        typeof currentIgnored === 'object' &&
        currentIgnored[packageId] &&
        Array.isArray(currentIgnored[packageId])
    ) {
        return currentIgnored[packageId];
    }

    return [];
};

export const updateIgnoreCodes = (key: string, codes: string[]): void => {
    const preselectedCodes = getIgnoredCodes(key);
    const uniqKeys = [...preselectedCodes, ...codes].filter(code => !preselectedCodes.includes(code));
    addPreselectedToIgnored(uniqKeys, key);
};

/**
 * Hook for special requests. It servers several purposes
 * 1) getting all special requests and checking whether they are selected
 * 2) getting alerts for special requests
 * 3) preselect needed special requests and show/hide alerts for them
 * 4) emit handlePreselectedDismissal function, which hides alerts on special request code toggle
 */

export const useSpecialRequests = (
    requestsTypes: ISpecialRequestsType[],
    specialRequestsContradictoryGroups?: ISpecialRequestContradictoryGroup[],
): {
    alerts: {
        description: string;
        message: string;
    }[];
    handlePreselectedDismissal: (code: string) => void;
    requests: IFlattenedSpecialRequest[];
} => {
    const {
        isEligibleToAddSpecialRequest,
        specialRequestsParams,
        hasInfant,
        packageId,
        addSpecialRequests,
        hardSyncQueryStore,
        setSpecialRequestsTypesByCode,
    } = useStore(store => ({
        isEligibleToAddSpecialRequest: store.bookingStore.isEligibleToAddSpecialRequest,
        packageId: store.bookingStore.packageId,
        hasInfant: store.bookingStore.infantsQuantity > 0,
        specialRequestsParams: store.queryParamStore.specialRequests,
        addSpecialRequests: store.bookingStore.addSpecialRequests,
        hardSyncQueryStore: store.routerStore.hardSyncQueryStore,
        setSpecialRequestsTypesByCode: store.hotelsStore.setSpecialRequestsTypesByCode,
    }));

    const isMounted = useIsMounted();

    // ignoredCodes are only safe to read from sessionStorage after mount —
    // using [] during SSR/hydration ensures server and client initial renders match.
    const ignoredCodes = isMounted ? getIgnoredCodes(packageId) : [];

    const [specialRequests, preselectedCodes] = !isEligibleToAddSpecialRequest
        ? [[], []]
        : getAllSpecialRequests(
              requestsTypes || [],
              specialRequestsParams,
              hasInfant,
              ignoredCodes,
              specialRequestsContradictoryGroups,
          );

    if (specialRequests.length) {
        const specialRequestsTypesByCode = {};

        specialRequests.forEach(el => {
            specialRequestsTypesByCode[el.code] = el.groupCode;
        });

        setSpecialRequestsTypesByCode(specialRequestsTypesByCode);
    }

    const [shownPreselectedCodes, setShownPreselectedCodes] = useState<string[]>([]);

    const preselectedAlerts: { description: string; message: string }[] = shownPreselectedCodes
        .map(preselectedCode => {
            const request = specialRequests.find(rq => rq.code === preselectedCode);

            return { message: request?.AlertTitle?.value || '', description: request?.preselectedAlert?.value || '' };
        })
        .filter(({ description }) => !!description);

    useEffect(() => {
        if (!isMounted) return;

        setShownPreselectedCodes(preselectedCodes);

        if (preselectedCodes.length && !isBackend()) {
            addSpecialRequests(preselectedCodes);
            hardSyncQueryStore();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted]);

    const handlePreselectedDismissal = (code: string): void => {
        if (shownPreselectedCodes.includes(code)) {
            const newPreselected = shownPreselectedCodes.filter(c => c !== code);
            setShownPreselectedCodes(newPreselected);
            const request = specialRequests.find(r => r.code === code);

            if (request?.isSelected) {
                addPreselectedToIgnored([code], packageId);
            }
        }
    };

    return {
        requests: specialRequests,
        alerts: preselectedAlerts,
        handlePreselectedDismissal,
    };
};

export default useSpecialRequests;
