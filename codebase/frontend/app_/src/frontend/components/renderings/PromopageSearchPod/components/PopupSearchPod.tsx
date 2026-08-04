import React, { FC, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { SearchWhoStore } from 'frontend/store/base/search/SearchWhoStore';
import { SearchStore } from 'frontend/store/holidays';
import { IAvailableDate } from 'models/data/IAvailableDate';
import { ISearchBarErrorMessage } from 'models/data/ISearchBarErrorMessage';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { RoomAllocation } from 'models/RoomAllocation';
import { Popup } from 'frontend/components/common/Popup';
import DateViewDropdown from 'frontend/components/common/SearchBarDropdownWhen/components/DateViewDropdown/DateViewDropdown';
import SearchBarDropdownWho from 'frontend/components/common/SearchBarDropdownWho/SearchBarDropdownWho';
import IconBed from 'frontend/components/icons/Bed';
import IconCalendar from 'frontend/components/icons/Calendar';
import { getWhenError } from 'frontend/components/renderings/PromopageSearchPod/PromopageSearchPod.utils';

import SearchBarInput from './SearchBarInput/SearchBarInput';

import styles from './PopupSearchPod.module.scss';

export interface IPopupSearchPodProps {
    activeField: Nullable<SearchBarDropdown>;
    availableDates: Nullable<IAvailableDate[]>;
    closePopup: (restore?: boolean) => void;
    dates: any[];
    errorMessages: Nullable<ISearchBarErrorMessage>;
    flexDays: number;
    isApplyDisabled: boolean;
    isError: (searchBarKey: string) => boolean;
    isFlexible: boolean;
    isGuestsParametersValid: boolean;
    isPopupOpen: boolean;
    onClearDates: () => void;
    onClearRoomClick: () => void;
    onSubmitSearch: () => void;
    rooms: RoomAllocation[];
    setActiveField: (field?: SearchBarDropdown) => void;
    togglePopup: () => void;
    validateChildrenAge: SearchWhoStore['validateChildrenAge'];
    validateWhenParameters: SearchStore['validateWhenParameters'];
    whenValue: string;
    whoValue: string;
    disableReturnFocusOnUnmount?: boolean;
}

export const PopupSearchPod: FC<IPopupSearchPodProps> = ({
    activeField,
    availableDates,
    closePopup,
    dates,
    errorMessages,
    flexDays,
    isApplyDisabled,
    isError,
    isFlexible,
    isGuestsParametersValid,
    isPopupOpen,
    onClearDates,
    onClearRoomClick,
    onSubmitSearch,
    rooms,
    setActiveField,
    togglePopup,
    validateChildrenAge,
    validateWhenParameters,
    whenValue,
    whoValue,
    disableReturnFocusOnUnmount,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const popupBodyRef = useRef<HTMLDivElement>(null);
    const inputsContainerRef = useRef<HTMLDivElement>(null);

    /**
     * Not include not active fields in the tab sequence (tabIndex = -1),
     * because after active field focus should be set to this field's dropdown.
     */
    const getFieldTabIndex = (field: SearchBarDropdown): number | undefined => (activeField === field ? undefined : -1);

    /**
     * Set focus on next search input after the last tabbed element in popup body.
     */
    const onPopupBodyKeyDown = (e: KeyboardEvent): void => {
        if (e.key === KeyboardKey.Tab && inputsContainerRef?.current?.contains(document.activeElement)) {
            const inputWrapper = document.activeElement?.closest('.search-bar__input-wr');
            const nextInputWrapper = (inputWrapper?.nextSibling || inputsContainerRef.current.firstChild) as Element;
            const nextInput = nextInputWrapper?.querySelector('input');
            nextInput?.focus();
        }
    };

    const focusWhenTab = (): void => {
        setActiveField(SearchBarDropdown.When);
    };

    const renderWhenField = () => (
        <div className='search-bar__input-wr'>
            <SearchBarInput
                id='search-when'
                icon={<IconCalendar />}
                label={getPhrase(SitecoreDictionary.SearchPodLabelsWhen)}
                placeholder={getPhrase(SitecoreDictionary.SearchPodPlaceholdersWhenField)}
                ariaDescription={getPhrase(SitecoreDictionary.SearchPodAccessibilityWhenFieldAriaDescription)}
                value={whenValue}
                hidePlaceholder={!!whenValue}
                toggleFocus={isFocused => {
                    if (activeField !== SearchBarDropdown.When) {
                        validateChildrenAge();
                    }

                    if (isFocused) {
                        setActiveField(SearchBarDropdown.When);
                    }
                }}
                isError={isError(SearchBarDropdown.When)}
                isEditable={false}
                showClearButton
                onClearButtonClick={action(onClearDates)}
                tabIndex={getFieldTabIndex(SearchBarDropdown.When)}
                isHighlighted={activeField === SearchBarDropdown.When}
            />
        </div>
    );

    const renderWhoField = () => (
        <div className='search-bar__input-wr'>
            <SearchBarInput
                id='search-who'
                icon={<IconBed />}
                label={getPhrase(SitecoreDictionary.SearchPodLabelsWho)}
                placeholder={getPhrase(SitecoreDictionary.SearchPodPlaceholdersWhoField)}
                value={whoValue}
                isEditable={false}
                hidePlaceholder={true}
                toggleFocus={isFocused => {
                    if (activeField !== SearchBarDropdown.Who) {
                        validateWhenParameters(false);
                    }

                    if (isFocused) {
                        setActiveField(SearchBarDropdown.Who);
                    }
                }}
                isError={!isGuestsParametersValid}
                showClearButton={false}
                tabIndex={getFieldTabIndex(SearchBarDropdown.Who)}
                isHighlighted={activeField === SearchBarDropdown.Who}
            />
        </div>
    );

    useEffect(() => {
        if (isPopupOpen) {
            popupBodyRef.current?.addEventListener('keydown', onPopupBodyKeyDown);
        }

        return () => {
            popupBodyRef.current?.removeEventListener('keydown', onPopupBodyKeyDown);
        };
    }, [isPopupOpen]);

    if (!isPopupOpen) {
        return null;
    }

    return (
        <Popup
            onClose={action(togglePopup)}
            containerClass={classNames('popup-search-pod', 'popup-search-pod__promo')}
            aria-labelledby='popup-search-pod-title'
            disableReturnFocusOnUnmount={disableReturnFocusOnUnmount}
        >
            <h2 className='popup-search-pod__title' id='popup-search-pod-title'>
                {getPhrase(SitecoreDictionary.SearchPodLabelsPerfectHoliday)}
            </h2>
            <div className='popup-search-pod__subtitle'>
                {getPhrase(SitecoreDictionary.PromopageSearchPodLabelsFillFields)}
            </div>
            <div ref={inputsContainerRef} className={'popup-search-pod__form search-bar sbv3 search-bar-box'}>
                {renderWhoField()}
                {renderWhenField()}
            </div>
            <div className='popup-search-pod__body search-bar-box search-bar sbv3' ref={popupBodyRef}>
                {activeField === SearchBarDropdown.When && (
                    <DateViewDropdown
                        value={dates}
                        onClose={action(closePopup)}
                        onApply={action(onSubmitSearch)}
                        isFlexible={isFlexible}
                        flexDays={flexDays}
                        availableDates={availableDates}
                        applyBtnText={getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                        isApplyDisabled={isApplyDisabled}
                        ignoreIsPromoPage={false}
                        errorMessage={getWhenError(errorMessages, activeField)}
                        isTitleHidden={false}
                    />
                )}
                {activeField === SearchBarDropdown.Who && (
                    <SearchBarDropdownWho
                        rooms={rooms}
                        onClose={action(closePopup)}
                        onApply={focusWhenTab}
                        onClearRoom={action(onClearRoomClick)}
                        ignoreValidationOnClose
                        isPromoViewForWhoField
                        applyBtnText={getPhrase(SitecoreDictionary.GlobalsButtonsNext)}
                        maxGuestsErrorClassName={styles.maxGuestsError}
                    />
                )}
            </div>
        </Popup>
    );
};

export default observer(PopupSearchPod);
