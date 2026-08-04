import React, { FC, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import settings from 'code/settings';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { getTextFromHtml } from 'frontend/utils/string.utils';
import { scrollParentToChild } from 'frontend/utils/ui.utils';
import { ISelectOption } from 'models/data/ISelectOption';
import { SearchPodValidationFields } from 'models/data/tracking/SearchPodEvent';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { RoomAllocation } from 'models/RoomAllocation';
import { ERROR_MESSAGE_CLASSNAME } from 'frontend/components/common/ErrorMessage';
import NumberOfRoomSelector from 'frontend/components/common/NumberOfRoomSelector/NumberOfRoomSelector';
import { CHILDREN_AGE_SELECTOR_ID } from 'frontend/components/common/RoomAllocationGroup/components/ChildrenAgesSelector/ChildrenAgesSelector';
import RoomAllocationGroup from 'frontend/components/common/RoomAllocationGroup/RoomAllocationGroup';
import SearchBarDropdownScrollableBox from 'frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox';
import SearchBarFieldErrorMessage from 'frontend/components/common/SearchBarFieldErrorMessage/SearchBarFieldErrorMessage';
import SearchPodFooterButtons from 'frontend/components/common/SearchPodFooterButtons/SearchPodFooterButtons';
import SvgGuestsFilled from 'frontend/components/icons-new/GuestsFilled';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import styles from './SearchBarDropdownWho.module.scss';

export interface ISearchBarDropdownWhoProps {
    onApply: () => void;
    onClearRoom: () => void;
    onClose: () => void;
    rooms: RoomAllocation[];
    applyBtnText?: string;
    ignoreValidationOnClose?: boolean;
    isDialogRole?: boolean;
    isMobilePromoViewForWhoField?: boolean;
    isPromoViewForWhoField?: boolean;
    maxGuestsErrorClassName?: string;
}

const SearchBarDropdownWho: FC<ISearchBarDropdownWhoProps> = ({
    onApply,
    onClearRoom,
    onClose,
    rooms,
    applyBtnText,
    ignoreValidationOnClose,
    isDialogRole,
    isPromoViewForWhoField,
    maxGuestsErrorClassName,
}) => {
    const {
        isTotalGuestsQuantityReached,
        isTotalGuestsQuantityValid,
        isGuestsParametersValid,
        validateWhoParameters,
        validateChildrenAge,
        isChildrenAgeValid,
        onChangeRooms,
        onRemoveRoom,
        isAutoAllocation,
        getPhrase,
        setSearchPerformWithNewParams,
        isPromoPage,
        isDefaultNumberGuestsInRooms,
        hasErrorInField,
        clearErrorMessage,
        trackValidation,
    } = useStore(stores => ({
        isTotalGuestsQuantityReached: stores.searchStore.searchWho.isTotalGuestsQuantityReached,
        isTotalGuestsQuantityValid: stores.searchStore.searchWho.isTotalGuestQuantityValid,
        isGuestsParametersValid: stores.searchStore.searchWho.isGuestsParametersValid,
        validateWhoParameters: stores.searchStore.validateWhoParameters,
        validateChildrenAge: stores.searchStore.searchWho.validateChildrenAge,
        isChildrenAgeValid: stores.searchStore.searchWho.isChildrenAgeValid,
        onChangeRooms: stores.searchStore.searchWho.onChangeRooms,
        onRemoveRoom: stores.searchStore.searchWho.onRemoveRoom,
        isAutoAllocation: stores.searchStore.searchWho.isAutoAllocation,
        getPhrase: stores.layoutStore.getPhrase,
        setSearchPerformWithNewParams: stores.searchStore.setSeachPerformWithNewParams,
        isPromoPage: stores.layoutStore.isPromoPage,
        isDefaultNumberGuestsInRooms: stores.searchStore.searchWho.isDefaultNumberGuestsInRooms,
        errorMessages: stores.searchStore.errorMessages,
        hasErrorInField: stores.searchStore.hasErrorInField,
        clearErrorMessage: stores.searchStore.clearErrorMessage,
        trackValidation: stores.trackingStore.trackValidation,
    }));

    // ensure that the store is initialized before accessing its fields, if local store is not initialized, it will return undefined
    const { fields } = useSearchPodStore() || {};
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [currentInvalidRoomIndex, setCurrentInvalidRoomIndex] = useState<number>(-1);

    const isMobile = useMobileViewport();

    const hasGuestQuantityError = hasErrorInField(SearchBarDropdown.Who);
    const scrollableBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (hasGuestQuantityError && isMobile) {
            scrollToError();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasGuestQuantityError, isMobile]);

    useEffect(() => {
        // A short delay is needed due to the existing delay in calculating maxHeight in the SearchBarDropdownScrollableBox component
        setTimeout(() => {
            scrollToError();
        }, settings.Animation.DurationMs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onChangeRoomsNumber = (selectedOption: ISelectOption): void => {
        if (!onChangeRooms(Number(selectedOption.value))) {
            setCurrentInvalidRoomIndex(-1);

            trackValidation(
                SearchPodValidationFields.MaxPAX,
                getTextFromHtml(getPhrase(SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML)),
            );
        }
    };

    const scrollToError = (): void => {
        const scrollableWrapper = isMobile ? dropdownRef.current : scrollableBoxRef.current;
        let errorElement = scrollableWrapper?.getElementsByClassName(ERROR_MESSAGE_CLASSNAME)[0];
        const errorParentElement = errorElement?.parentElement;

        /**
         * When scrolling from the bottom to the error caused by missing child's age,
         * ensure that both the input fields and the title are visible.
         */
        if (errorParentElement?.id === CHILDREN_AGE_SELECTOR_ID) {
            errorElement = errorParentElement;
        }

        if (scrollableWrapper && errorElement) {
            scrollParentToChild(scrollableWrapper, errorElement);
        }
    };

    const handleOnClick = (onClickHandler: () => void, ignoreValidation = false): void => {
        const isValid = ignoreValidation || (validateChildrenAge() && !validateWhoParameters());

        // Use timeout for scrolling to errors, because children age errors are rendered with delay in <RoomAllocationGroup>
        isValid ? onClickHandler() : setTimeout(() => scrollToError());
    };

    const onApplyClick = (): void => {
        handleOnClick(onApply);

        if (isPromoPage) {
            setSearchPerformWithNewParams(true);
        }
    };

    const onCloseClick = (): void => {
        handleOnClick(onClose, !!ignoreValidationOnClose);
    };

    const onResetBtn = (): void => {
        onClearRoom();
        setCurrentInvalidRoomIndex(-1);
        clearErrorMessage();
    };

    const titleId = 'search-who-dd-title';
    const ariaAttributes = isDialogRole
        ? { role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId }
        : undefined;

    return (
        <div
            className={classNames(styles.wrapper, isPromoViewForWhoField && styles.promoView)}
            id='search-who-dd'
            ref={dropdownRef}
            {...ariaAttributes}
            data-tid='search-bar-dropdown-who'
        >
            <SearchBarFieldErrorMessage
                fieldErrorType={SearchBarDropdown.Who}
                errorClassName={classNames(!isPromoPage && styles.errorMessage, maxGuestsErrorClassName)}
            />

            <div className={styles.values}>
                <h2 className='visually-hidden' id={titleId}>
                    {/* should remove dictionary label during Promo Page Redesign */}
                    {fields?.WhoFieldDropdownLabel?.value ||
                        getPhrase(SitecoreDictionary.SearchPodAccessibilityWhoFieldDropdownLabel)}
                </h2>
                <div>
                    <div className={styles.head} data-tid='rooms-section-title'>
                        <i className={styles.icon}>
                            <SVGHotelBedFilled />
                        </i>
                        <span data-tid='rooms-section-title-text'>
                            {/* should remove dictionary label during Promo Page Redesign */}
                            {fields?.WhoDropdownRoomsLabel?.value ||
                                getPhrase(SitecoreDictionary.SearchPodLabelsWhoDropdownRooms)}
                        </span>
                    </div>

                    <NumberOfRoomSelector
                        numberOfRooms={rooms.length}
                        onChange={onChangeRoomsNumber}
                        isAutoAllocation={isAutoAllocation}
                        className={styles.roomSelect}
                    />
                </div>

                <div className={classNames(styles.roomBox)}>
                    <div className={styles.head} data-tid='guests-section-title'>
                        <i className={styles.icon}>
                            <SvgGuestsFilled />
                        </i>
                        {/* dictionaries should be removed in scope of Promo Page Redesign */}
                        <div data-tid='guests-section-title-text' className={styles.guestsSectionTitleText}>
                            {fields?.WhoDropdownGuestsLabel?.value ||
                                getPhrase(SitecoreDictionary.SearchPodLabelsWhoDropdownGuests)}
                            <span className={styles.limitLabel}>
                                {fields?.WhoDropdownGuestsLimitLabel?.value ||
                                    getPhrase(SitecoreDictionary.SearchPodLabelsWhoDropdownGuestsLimit)}
                            </span>
                        </div>
                    </div>

                    <SearchBarDropdownScrollableBox ref={scrollableBoxRef} className={styles.scrollableBox}>
                        {rooms.map((room, index) => (
                            <RoomAllocationGroup
                                key={room.id}
                                hideErrors={index !== currentInvalidRoomIndex}
                                roomIndex={index}
                                room={room}
                                number={index + 1}
                                onRemove={onRemoveRoom}
                                isTotalGuestsQuantityReached={isTotalGuestsQuantityReached}
                                isTotalGuestsQuantityValid={isTotalGuestsQuantityValid}
                                onTriggerError={setCurrentInvalidRoomIndex}
                                validateWhoParameters={validateWhoParameters}
                                validateChildrenAge={validateChildrenAge}
                                isChildrenAgeValid={isChildrenAgeValid}
                                isSearchBar
                            />
                        ))}
                    </SearchBarDropdownScrollableBox>
                </div>
            </div>

            <SearchPodFooterButtons
                applyButtonLabel={applyBtnText || getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                /* should remove dictionary label during Promo Page Redesign */
                clearButtonLabel={
                    fields?.ResetToDefaultLabel?.value ||
                    getPhrase(SitecoreDictionary.SearchPodButtonsClearWhoSelection)
                }
                isShownClearButton={!isDefaultNumberGuestsInRooms}
                onApplyClick={onApplyClick}
                onCloseClick={onCloseClick}
                onClearClick={onResetBtn}
                isApplyButtonDisabled={!isGuestsParametersValid}
                fieldName={SearchBarDropdown.Who}
            />
        </div>
    );
};

export default observer(SearchBarDropdownWho);
