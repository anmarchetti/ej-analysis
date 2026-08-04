import { FC, useEffect, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { formatDateL10n, formatDatesRange } from 'frontend/utils/date.utils';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import Drawer from 'frontend/components/common/Drawer';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import SearchBarDropdownWhen from 'frontend/components/common/SearchBarDropdownWhen/SearchBarDropdownWhen';
import IconCalendar from 'frontend/components/icons/Calendar';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';
import SBInput from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SBInput/SBInput';
import SearchBarAnimatedDropdown from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarAnimatedDropdown/SearchBarAnimatedDropdown';
import SearchBarErrorMessage from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarErrorMessage/SearchBarErrorMessage';
import useInputAreaFocus from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useInputAreaFocus';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export interface ISearchBarWhenContentProps {
    changeSelectedDropdown: (field: SearchBarDropdown | null) => void;
    selectedDropdown: SearchBarDropdown | null;
}

const SearchBarWhenContent: FC<ISearchBarWhenContentProps> = ({ selectedDropdown, changeSelectedDropdown }) => {
    const {
        errorMessages,
        from,
        to,
        isNeedOpenWhenField,
        clearDates,
        setNeedOpenWhenField,
        hasErrorInField,
        isReferer,
        hasOffers,
        isHotelDetailsBookPage,
        isMonthSearch,
        trackBasicWhenClickEvent,
        trackWhenClearFieldInput,
    } = useStore(stores => ({
        errorMessages: stores.searchStore.errorMessages,
        setNeedOpenWhenField: stores.searchStore.setNeedOpenWhenField,
        isNeedOpenWhenField: stores.searchStore.isNeedOpenWhenField,
        from: stores.searchStore.searchWhen.from,
        to: stores.searchStore.searchWhen.to,
        clearDates: stores.searchStore.searchWhen.clearDates,
        hasErrorInField: stores.searchStore.hasErrorInField,
        isReferer: stores.queryParamStore.isReferer,
        hasOffers: stores.hotelsStore.hasOffers,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        isMonthSearch: stores.searchStore.searchWhen.isMonthSearch,
        trackBasicWhenClickEvent: stores.trackingStore.searchPod.trackBasicWhenClickEvent,
        trackWhenClearFieldInput: stores.trackingStore.searchPod.trackWhenClearFieldInput,
    }));

    const {
        fields: {
            WhenFieldLabel,
            WhenFieldPlaceholder,
            WhenFieldAriaDescription,
            TryAdjustDatesErrorMessage,
            WhenDropdownTitle,
        } = {},
    } = useSearchPodStore();

    const isMobile = useMobileViewport();

    const isWhenDropdownSelected = selectedDropdown === SearchBarDropdown.When;
    const interactableFieldRef = useRef<HTMLDivElement | null>(null);

    const onDropdownClose = (): void => {
        changeSelectedDropdown(null);
    };

    const openWhenDropdown = (): void => {
        changeSelectedDropdown(SearchBarDropdown.When);
    };

    useInputAreaFocus({
        reset: onDropdownClose,
        interactableFieldRef,
        isUserInteractingWithInput: isWhenDropdownSelected,
        isDropdownSelected: isWhenDropdownSelected,
    });

    useEffect(() => {
        const openWhenFieldFlow = (): void => {
            clearDates();
            changeSelectedDropdown(SearchBarDropdown.When);
            setNeedOpenWhenField(false);
        };

        if (isNeedOpenWhenField) {
            openWhenFieldFlow();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNeedOpenWhenField]);
    const hasBeenRedirectedFromIframeWithNoOffers = isReferer && !hasOffers && !isHotelDetailsBookPage;

    useEffect(() => {
        if (hasBeenRedirectedFromIframeWithNoOffers && isWhenDropdownSelected) {
            clearDates();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasBeenRedirectedFromIframeWithNoOffers, isWhenDropdownSelected]);

    const whenValue = useMemo(() => {
        if (isMonthSearch) {
            return formatDateL10n(from, DATE_FORMATS.fullMonthAndYear);
        }

        return from ? formatDatesRange(from, to, DATE_FORMATS.L) : '';
    }, [from, to, isMonthSearch]);

    const hasError = hasErrorInField(SearchBarDropdown.When);
    const inputPlaceholder = getFieldValue(WhenFieldPlaceholder);
    const inputLabel = getFieldValue(WhenFieldLabel);
    const inputAriaDescription = getFieldValue(WhenFieldAriaDescription);

    const onClearInput = (): void => {
        trackWhenClearFieldInput();
        clearDates();
        openWhenDropdown();
    };

    const toggleInputFocus = (): void => {
        trackBasicWhenClickEvent();
        openWhenDropdown();
    };

    return (
        <div className='field-box field-box--when' data-tid='when-field-box' ref={interactableFieldRef}>
            <div className='search-bar__input-wr'>
                <SBInput
                    id='search-when'
                    icon={<IconCalendar />}
                    label={inputLabel}
                    placeholder={inputPlaceholder}
                    ariaDescription={inputAriaDescription}
                    value={whenValue}
                    hidePlaceholder={isWhenDropdownSelected || !!whenValue}
                    onFocus={toggleInputFocus}
                    isError={hasError}
                    isEditable={false}
                    showClearButton={!isMobile}
                    onClearButtonClick={onClearInput}
                    isInputHighlighted={isWhenDropdownSelected}
                />
            </div>

            {!isMobile && <SearchBarErrorMessage field={SearchBarDropdown.When} isActive={isWhenDropdownSelected} />}

            {!errorMessages && hasBeenRedirectedFromIframeWithNoOffers && isWhenDropdownSelected && (
                <ErrorMessage
                    message={getFieldValue(TryAdjustDatesErrorMessage)}
                    icon={<SvgInfoFilled />}
                    IfIsNotificationOrange
                    errorMessageClass='try-adjust-dates-info'
                />
            )}

            {!isMobile && (
                <SearchBarAnimatedDropdown isOpened={isWhenDropdownSelected} selectedDropdown={selectedDropdown}>
                    <SearchBarDropdownWhen onDropdownClose={onDropdownClose} />
                </SearchBarAnimatedDropdown>
            )}

            {isMobile && (
                <Drawer open={isWhenDropdownSelected} aria-label={getFieldValue(WhenDropdownTitle)}>
                    <div className='search-bar__mobile-box'>
                        <div
                            className={classNames('search-bar__dd-wr', 'search-bar__dd-wr--when', {
                                ['search-bar__dd-wr--nothing-selected']: !from && !to,
                            })}
                        >
                            <SearchBarErrorMessage field={SearchBarDropdown.When} isActive={isWhenDropdownSelected} />
                            {isWhenDropdownSelected && <SearchBarDropdownWhen onDropdownClose={onDropdownClose} />}
                        </div>
                    </div>
                </Drawer>
            )}
        </div>
    );
};

export default observer(SearchBarWhenContent);
