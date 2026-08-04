import { FC, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import Drawer from 'frontend/components/common/Drawer';
import SearchBarDropdownWho from 'frontend/components/common/SearchBarDropdownWho/SearchBarDropdownWho';
import SBInput from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SBInput/SBInput';
import SearchBarAnimatedDropdown from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarAnimatedDropdown/SearchBarAnimatedDropdown';
import useInputAreaFocus from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useInputAreaFocus';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export interface ISearchBarWhoContentProps {
    changeSelectedDropdown: (field: SearchBarDropdown | null) => void;
    selectedDropdown: SearchBarDropdown | null;
}

const SearchBarWhoContent: FC<ISearchBarWhoContentProps> = ({ selectedDropdown, changeSelectedDropdown }) => {
    const {
        roomsAllocation,
        isGuestsParametersValid,
        isDefaultNumberGuestsInRooms,
        whoValue,
        onClearRoom,
        validateChildrenAge,
        trackWhoInputClick,
    } = useStore(stores => ({
        roomsAllocation: stores.searchStore.searchWho.roomsAllocation,
        isGuestsParametersValid: stores.searchStore.searchWho.isGuestsParametersValid,
        isDefaultNumberGuestsInRooms: stores.searchStore.searchWho.isDefaultNumberGuestsInRooms,
        whoValue: stores.searchStore.searchWho.whoValue,
        onClearRoom: stores.searchStore.searchWho.onClearRoom,
        validateChildrenAge: stores.searchStore.searchWho.validateChildrenAge,
        trackWhoInputClick: stores.trackingStore.searchPod.trackWhoInputClick,
    }));

    const { fields: { WhoFieldLabel, WhoFieldDropdownLabel } = {} } = useSearchPodStore();
    const isMobile = useMobileViewport();
    const isWhoDropdownSelected = selectedDropdown === SearchBarDropdown.Who;
    const interactableFieldRef = useRef<HTMLDivElement | null>(null);

    const inputLabel = getFieldValue(WhoFieldLabel);

    useEffect(() => {
        if (isWhoDropdownSelected) {
            validateChildrenAge();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWhoDropdownSelected]);

    const onDropdownClose = (): void => {
        changeSelectedDropdown(null);
    };

    useInputAreaFocus({
        reset: onDropdownClose,
        interactableFieldRef,
        isUserInteractingWithInput: isWhoDropdownSelected,
        isDropdownSelected: isWhoDropdownSelected,
    });

    const onClearRoomClick = (): void => {
        onClearRoom();
    };

    const toggleInputFocus = (): void => {
        trackWhoInputClick();
        changeSelectedDropdown(SearchBarDropdown.Who);
    };

    // TO DO remove onApply when popup search pod will be deleted
    const dropdownWhoProps = {
        rooms: roomsAllocation,
        onClose: onDropdownClose,
        onApply: onDropdownClose,
        onClearRoom: onClearRoomClick,
        ignoreValidationOnClose: true,
    };

    return (
        <div className='field-box field-box--who' data-tid='who-field-box' ref={interactableFieldRef}>
            <div className='search-bar__input-wr'>
                <SBInput
                    id='search-who'
                    label={inputLabel}
                    value={whoValue}
                    isEditable={false}
                    onFocus={toggleInputFocus}
                    isError={!isGuestsParametersValid}
                    showClearButton={false}
                    isInputHighlighted={isWhoDropdownSelected}
                />
            </div>

            {!isMobile && (
                <SearchBarAnimatedDropdown isOpened={isWhoDropdownSelected} selectedDropdown={selectedDropdown}>
                    <SearchBarDropdownWho {...dropdownWhoProps} isDialogRole />
                </SearchBarAnimatedDropdown>
            )}

            {isMobile && (
                <Drawer open={isWhoDropdownSelected} aria-label={getFieldValue(WhoFieldDropdownLabel)}>
                    <div className='search-bar__mobile-box'>
                        <div className='search-bar__input-wr'>
                            <SBInput
                                id='search-who--drawer'
                                label={inputLabel}
                                value={whoValue}
                                isEditable={false}
                                isError={!isGuestsParametersValid}
                                showClearButton={false}
                                isInputHighlighted={isWhoDropdownSelected}
                            />
                        </div>

                        <div
                            className={classNames('search-bar__dd-wr', 'search-bar__dd-wr--who', {
                                ['search-bar__dd-wr--nothing-selected']: isDefaultNumberGuestsInRooms,
                            })}
                        >
                            {isWhoDropdownSelected && <SearchBarDropdownWho {...dropdownWhoProps} />}
                        </div>
                    </div>
                </Drawer>
            )}
        </div>
    );
};

export default observer(SearchBarWhoContent);
