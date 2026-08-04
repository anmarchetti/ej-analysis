import React, { FC, useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { AUTO_ALLOCATION_SITECORE_VALUE } from 'frontend/store/base/search/SearchWhoStore';
import { TStores } from 'frontend/store/IStores';
import { ISelectOption } from 'models/data/ISelectOption';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import DropdownIndicator from 'frontend/components/common/Select/DropdownIndicator/DropdownIndicator';
import ValueContainer from 'frontend/components/common/Select/ValueContainer';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import styles from './NumberOfRoomSelector.module.scss';

export interface INumberOfRoomsSelectorProps {
    isAutoAllocation: boolean; // please don't use this props from stores: they must be fetched directly on every render for component versatility
    numberOfRooms: number;
    onChange: (value: ISelectOption) => void;
    className?: string;
    isGroup?: boolean;
    placeholder?: string;
}

const NumberOfRoomSelector: FC<INumberOfRoomsSelectorProps> = ({
    isAutoAllocation,
    numberOfRooms,
    onChange,
    isGroup,
    placeholder,
    className,
}) => {
    const {
        getPhrase,
        getSettingAsNumber,
        trackWhoDropdownRoomSelectorInteraction,
        trackWhoDropdownRoomSelection,
        errorMessages,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
        trackWhoDropdownRoomSelectorInteraction: stores.trackingStore.searchPod.trackWhoDropdownRoomSelectorInteraction,
        trackWhoDropdownRoomSelection: stores.trackingStore.searchPod.trackWhoDropdownRoomSelection,
        errorMessages: stores.searchStore.errorMessages,
    }));

    const { isSearchPodInitialized } = useSearchPodStore() || {};

    // prevents double tracking — react-select may fire onMenuOpen/onMenuClose multiple times
    // due to internal re-renders or overlapping event handlers
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        if (isSearchPodInitialized) {
            trackWhoDropdownRoomSelectorInteraction(isMenuOpen);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMenuOpen, isSearchPodInitialized]);

    const maxNumberOfRoomsSetting = isGroup ? SiteSettings.MaxNumberOfGroupBookingRooms : SiteSettings.MaxNumberOfRooms;
    const maxNumberOfRooms = getSettingAsNumber(maxNumberOfRoomsSetting);

    const options: Array<ISelectOption> = [
        {
            value: AUTO_ALLOCATION_SITECORE_VALUE,
            label: getPhrase(SitecoreDictionary.RoomAllocationLabelsIDontMindOption),
        },
        ...Array.from({ length: maxNumberOfRooms }, (_, i) => ({
            value: i + 1,
            label: i + 1,
        })),
    ];

    const value = {
        value: isAutoAllocation ? AUTO_ALLOCATION_SITECORE_VALUE : numberOfRooms,
        label: isAutoAllocation ? getPhrase(SitecoreDictionary.RoomAllocationLabelsIDontMindOption) : numberOfRooms,
    };

    const defaultPlaceholder = getPhrase(SitecoreDictionary.RoomAllocationLabelsRooms);

    const handleChange = (option: ISelectOption): void => {
        if (isSearchPodInitialized) {
            trackWhoDropdownRoomSelection(Number(option.value));
        }

        onChange(option);
    };
    const isMaxNumberOfGuestsPerRoomErrorShown =
        errorMessages?.key === SearchBarDropdown.Who &&
        errorMessages?.message === SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom;

    return (
        <div className={classNames(styles.wrapper, className)}>
            <div className={styles.box} data-tid='room-selector'>
                <Select
                    className={classNames('custom-select', styles.select, {
                        'custom-select--error': isMaxNumberOfGuestsPerRoomErrorShown,
                    })}
                    classNamePrefix='custom-select'
                    options={options}
                    defaultValue={{ value: numberOfRooms, label: numberOfRooms }}
                    value={value}
                    onChange={handleChange}
                    isSearchable={false}
                    components={{ DropdownIndicator, ValueContainer }}
                    blurInputOnSelect={true}
                    maxMenuHeight={176}
                    selectProps={{ hasCustomPlaceholder: false }}
                    placeholder={placeholder || defaultPlaceholder}
                    menuPosition='fixed'
                    onMenuOpen={(): void => setIsMenuOpen(true)}
                    onMenuClose={(): void => setIsMenuOpen(false)}
                    menuIsOpen={isMenuOpen}
                />
            </div>
        </div>
    );
};

export default NumberOfRoomSelector;
