import { useState } from 'react';

import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { DestinationType } from 'models/enum/DestinationType';
import { KeyboardKey } from 'models/enum/KeyboardKey';

export const getSelectedCodes = (
    place: IDestinationCountry | IDestination,
    availableCodes: string[] | null,
): string[] => {
    const codes: string[] = [];

    if (place.type === DestinationType.Group) {
        place.children?.forEach(child => {
            if (availableCodes) {
                if (availableCodes.indexOf(child.code) != -1) {
                    codes.push(child.code);
                }
            } else {
                codes.push(child.code);
            }
        });
    } else {
        codes.push(place.code);
    }

    return codes;
};

export const findNextAvailablePlaceIndex = (
    places: Nullable<IDestinationCountry[] | IDestination[]>,
    currentIndex: number,
    delta: 1 | -1,
): number => {
    if (!places?.length) {
        return -1;
    }

    let newAvailableIdx = -1;
    const deltaValue = delta;
    const startIndex = currentIndex === -1 ? 0 : currentIndex + deltaValue;

    if (startIndex < 0 || startIndex > places.length - 1) {
        return currentIndex;
    }

    for (let i = startIndex; i < places.length && i >= 0; i += deltaValue) {
        const place = places[i];

        if (place.showOnSearchPod) {
            newAvailableIdx = i;
            break;
        }
    }

    return newAvailableIdx;
};

export const handleSearchBarInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    onEnter: () => void,
    onIndexUpdate: (delta: 1 | -1) => void,
): void => {
    if (e.key === KeyboardKey.ENTER) {
        onEnter();
    }

    if (e.key === KeyboardKey.ArrowUp) {
        onIndexUpdate(-1);
    } else if (e.key === KeyboardKey.ArrowDown) {
        onIndexUpdate(1);
    }
};

export const useSuggestionsPopupNavigation = (
    selectCodes: (codes: string[], place: IDestinationCountry | IDestination) => void,
    filteredPlaces: IDestinationCountry[] | IDestination[] | null,
    availableOriginsCodes: string[] | null,
): {
    popupItemHighlightedIdx: number;
    resetHighlightedIdx: () => void;
    sbInputKeyboardEvent: (e: React.KeyboardEvent<HTMLInputElement>) => void;
} => {
    const [popupItemHighlightedIdx, setPopupItemHighlightedIdx] = useState<number>(0);

    const resetHighlightedIdx = (): void => {
        updateHighlightedIdx(1, -1);
    };

    const updateHighlightedIdx = (delta: 1 | -1, id?: number): void => {
        const newAvailableIdx = findNextAvailablePlaceIndex(filteredPlaces, id ?? popupItemHighlightedIdx, delta);

        setPopupItemHighlightedIdx(newAvailableIdx);
    };

    const onEnter = (): void => {
        const place = filteredPlaces?.[popupItemHighlightedIdx];

        if (place) {
            const codes: string[] = getSelectedCodes(place, availableOriginsCodes);

            selectCodes(codes, place);
        }
    };

    const sbInputKeyboardEvent = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        handleSearchBarInputKeyDown(e, onEnter, updateHighlightedIdx);
    };

    return { popupItemHighlightedIdx, resetHighlightedIdx, sbInputKeyboardEvent };
};
