import { IFilterOption, ISelectedFilter } from 'models/data/IFilters';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

const isRemoveSelectBoardPills = ({ filterSelected, availableFilters }) => {
    const boardFilters = availableFilters.find(el => el.code === FilterGroupCodes.BoardType);

    if (!boardFilters) return false;

    return (
        boardFilters?.options.find(
            el => el.code === filterSelected.code && el.boardGroup && el.boardGroup.code !== el.code,
        ) || boardFilters?.options.find(el => el.children?.some(x => x.code === filterSelected.code))
    );
};

const isRemoveSelectDestinationPills = ({ filterSelected, availableFilters, selectedFilters }) => {
    const destinationFilters = availableFilters.find(el => el.code === FilterGroupCodes.Destination);

    if (!destinationFilters) return false;

    const countries = destinationFilters.options || [];

    const selectedIndex = countries.findIndex(el =>
        (el.children || []).find(ch => filterSelected.code === ch.code && filterSelected.groupCode === ch.groupCode),
    );

    // remove pill if parent country has all regions selected
    if (selectedIndex > -1) {
        const isCountrySelected = countries[selectedIndex].children?.every(
            ch => selectedFilters.findIndex(el => el.code === ch.code && el.groupCode === ch.groupCode) > -1,
        );

        if (isCountrySelected) {
            return true;
        }
    }

    // remove pill if it's children are pre-checked
    const isDestinationPreCheckCountry =
        countries.findIndex(el => {
            if (el.code === filterSelected.code) {
                return (el.children || [])
                    .filter(ch => ch.destinationInfo?.type !== DestinationType.VirtualRegion) // no need to check virtual regions, as it will be checked if related checked
                    .every(
                        ch =>
                            selectedFilters.findIndex(
                                el => el.code === ch.code && el.groupCode === ch.groupCode && el.preChecked,
                            ) > -1,
                    );
            }

            return false;
        }) > -1;

    if (isDestinationPreCheckCountry) {
        return true;
    }

    // remove pill if all it's related regions are pre-checked
    if (filterSelected.destinationInfo?.type === DestinationType.VirtualRegion) {
        const isAllRelatedPreChecked = filterSelected.destinationInfo.relatedRegions.every(rc =>
            selectedFilters.find(f => f.groupCode === FilterGroupCodes.Destination && f.code === rc && f.preChecked),
        );

        if (isAllRelatedPreChecked) {
            return true;
        }
    }

    // remove pill if related virtual region has all regions selected
    if (filterSelected.destinationInfo?.type === DestinationType.Region) {
        let relatedVirtualRegion: IFilterOption | undefined;

        countries.some(c => {
            const virtual = c.children?.find(
                ch =>
                    ch.destinationInfo?.type === DestinationType.VirtualRegion &&
                    ch.destinationInfo.relatedRegions.indexOf(filterSelected.code) > -1,
            );

            if (virtual) {
                relatedVirtualRegion = virtual;

                return true;
            }

            return false;
        });

        if (relatedVirtualRegion) {
            const allInVirtualSelected = relatedVirtualRegion.destinationInfo?.relatedRegions.every(
                code =>
                    selectedFilters.findIndex(el => el.code === code && el.groupCode === FilterGroupCodes.Destination) >
                    -1,
            );

            if (allInVirtualSelected) {
                return true;
            }
        }
    }

    return false;
};

const useSelectedFilters = (availableFilters, selectedFilters) => {
    const shouldShow = (filter: ISelectedFilter): boolean => {
        if (filter.groupCode === FilterGroupCodes.Destination) {
            return (
                !filter.preChecked &&
                !isRemoveSelectDestinationPills({ filterSelected: filter, availableFilters, selectedFilters })
            );
        }

        if (filter.groupCode === FilterGroupCodes.Duration || filter.groupCode === FilterGroupCodes.Flights) {
            return !filter.preChecked;
        }

        if (filter.groupCode === FilterGroupCodes.BoardType) {
            return !isRemoveSelectBoardPills({ filterSelected: filter, availableFilters });
        }

        return true;
    };

    const filters = (selectedFilters || []).filter(shouldShow);

    return filters;
};

export default useSelectedFilters;
