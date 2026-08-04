import { useState } from 'react';

import { SearchToStore } from 'frontend/store/base/search/SearchToStore';
import { getIDestinationByCode } from 'frontend/utils/destinations.utils';
import { IDestinationCountry } from 'models/data/IDestinationCountries';

export interface IUseDestinationSelectionHandlersProps {
    addDestination: SearchToStore['addDestination'];
    availableCodes: string[] | null;
    availableDestinationsCodes: SearchToStore['availableDestinationsCodes'];
    isCheckedItem: SearchToStore['isCheckedItem'];
    isDisabledItem: SearchToStore['isDisabledItem'];
    parent: IDestinationCountry;
    removeDestination: SearchToStore['removeDestination'];
    selectedDestinations: SearchToStore['selectedDestinations'];
    trackToRegionSelectAll: (parent: IDestinationCountry, isSelected: boolean) => void;
    trackToRegionSelectSingle: (parent: IDestinationCountry, selectedAirportCode: string, isSelected: boolean) => void;
    updateDestinationCodes: SearchToStore['updateDestinationCodes'];
}

export const useDestinationSelectionHandlers = ({
    parent,
    availableCodes,
    addDestination,
    removeDestination,
    updateDestinationCodes,
    isDisabledItem,
    isCheckedItem,
    trackToRegionSelectSingle,
    trackToRegionSelectAll,
    selectedDestinations,
    availableDestinationsCodes,
}: IUseDestinationSelectionHandlersProps): {
    changeGroupSelection: (isSelected: boolean) => void;
    changeItemSelection: (isSelected: boolean, code: string) => void;
} => {
    const [isWholeGroupSelected, setIsWholeGroupSelected] = useState<boolean>(isCheckedItem(parent));

    const changeGroupSelection = (isSelected: boolean): void => {
        const parentDestination = getIDestinationByCode([parent], parent.code);

        if (isSelected) {
            addDestination(parentDestination, true);
            setIsWholeGroupSelected(true);
        } else {
            removeDestination(parentDestination, true);
            setIsWholeGroupSelected(false);
        }

        parent.children?.forEach(child => {
            const childDestination = getIDestinationByCode([parent], child.code);

            removeDestination(childDestination, true);
        });

        updateDestinationCodes();

        trackToRegionSelectAll(parent, isSelected);
    };

    const changeItemSelection = (isSelected: boolean, code: string): void => {
        if (!code) {
            //destination item has no code
            return;
        }

        if (code === parent.code) {
            changeGroupSelection(isSelected);

            return;
        }

        isSelected ? selectItem(code) : unselectItem(code);
        updateDestinationCodes();

        trackToRegionSelectSingle(parent, code, isSelected);
    };

    const willParentBecomeFullySelected = (incomingCode: string): boolean => {
        const isAllDestinationsAvailable = availableDestinationsCodes === null;

        if (!isAllDestinationsAvailable && availableDestinationsCodes?.length === 0) return false;

        const children = parent.children ?? [];
        const incomingDestination = getIDestinationByCode([parent], incomingCode);
        const virtualParent = children.find(virtual => virtual.relatedRegions?.includes(incomingCode));

        const incomingCodes = new Set([...(incomingDestination.relatedRegions ?? []), incomingCode]);

        // The case when by chosen child of a virtual region we check the virtual code too
        if (virtualParent) {
            incomingCodes.add(virtualParent.code);
        }

        const availableCodes = new Set(isAllDestinationsAvailable ? [] : availableDestinationsCodes);
        const alreadySelectedCodes = new Set(selectedDestinations.map(d => d.code));

        return !children.some(
            ({ code }) =>
                (isAllDestinationsAvailable || availableCodes.has(code)) &&
                !incomingCodes.has(code) &&
                !alreadySelectedCodes.has(code),
        );
    };

    const selectItem = (code: string): void => {
        const isParentSelected = !isDisabledItem(parent) && isCheckedItem(parent);
        const areAllChildrenSelected = willParentBecomeFullySelected(code);

        if (isParentSelected || areAllChildrenSelected) {
            changeGroupSelection(true);
        } else {
            const destination = getIDestinationByCode([parent], code);

            addDestination(destination, true);
        }
    };

    const unselectItem = (code: string): void => {
        const destination = getIDestinationByCode([parent], code);

        //if only group has one subitem then the whole group was selected
        if (!isWholeGroupSelected) {
            /** Remove related regions from popup */
            destination?.relatedRegions?.forEach(relatedRegionCode => {
                if (!relatedRegionCode) {
                    return;
                }

                const relatedRegionDestination = getIDestinationByCode([parent], relatedRegionCode);

                removeDestination(relatedRegionDestination, true);
            });

            /** Find a virtual region which is related to unselected region and uncheck it */
            const virtualRegions = parent.children?.filter(x => x.relatedRegions?.includes(code));

            virtualRegions?.forEach(virtualRegion => {
                if (!virtualRegion) {
                    return;
                }

                const virtualRegionDestination = getIDestinationByCode([parent], virtualRegion.code);

                removeDestination(virtualRegionDestination, true);
            });

            removeDestination(destination, true);

            return;
        }

        // check for case when country with one region has been checked
        if (parent.children?.length === 1) {
            changeGroupSelection(false);

            return;
        }

        setIsWholeGroupSelected(false);

        const parentDestination = getIDestinationByCode([parent], parent.code);

        removeDestination(parentDestination, true);

        parent.children?.forEach(child => {
            if (
                !child.code ||
                child.code === code ||
                destination?.relatedRegions?.includes(child.code) ||
                child.relatedRegions?.includes(code)
            ) {
                return;
            }

            if (!availableCodes || availableCodes.includes(child.code)) {
                const childDestination = getIDestinationByCode([parent], child.code);

                addDestination(childDestination, true);
            }
        });
    };

    return { changeItemSelection, changeGroupSelection };
};
