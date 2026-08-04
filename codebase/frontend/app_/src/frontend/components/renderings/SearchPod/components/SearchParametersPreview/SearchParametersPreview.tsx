import React, { FC, useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n, formatDatesRange } from 'frontend/utils/date.utils';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BackToReferrer from 'frontend/components/common/BackToReferrer/BackToReferrer';
import Button from 'frontend/components/common/Button';
import IconBed from 'frontend/components/icons/Bed';
import IconCalendar from 'frontend/components/icons/Calendar';
import IconMapMarker from 'frontend/components/icons/MapMarker';
import IconPlainDeparture from 'frontend/components/icons/PlainDeparture';
import IconPen from 'frontend/components/icons-new/EditLine';
import SearchParameter from 'frontend/components/renderings/SearchPod/components/SearchParametersPreview/components/SearchParameter/SearchParameter';
import styles from 'frontend/components/renderings/SearchPod/components/SearchParametersPreview/SearchParametersPreview.module.scss';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

const SPACE_UNICODE_CODE = '\u00A0';

export interface ISearchParametersPreviewProps {
    onEdit: (isEdit?: boolean) => void;
    onOpenSearchBarDropdown: (dropdown: SearchBarDropdown) => void;
}

const SearchParametersPreview: FC<ISearchParametersPreviewProps> = ({ onEdit, onOpenSearchBarDropdown }) => {
    const {
        destinationsDisplayValue,
        originsDisplayValue,
        from,
        to,
        totalGuestsQuantity,
        roomsAllocationLength,
        setOldSearchParam,
        isOldParamSet,
        getPhrase,
        isAutoAllocation,
        referrer,
        returnPath,
        isMonthSearch,
        isMobileAppHideFeatures,
    } = useStore((stores: TStores) => ({
        destinationsDisplayValue: stores.searchStore.searchTo.displayValue,
        originsDisplayValue: stores.searchStore.searchFrom.displayValue,
        from: stores.searchStore.searchWhen.from,
        to: stores.searchStore.searchWhen.to,
        totalGuestsQuantity: stores.searchStore.searchWho.totalGuestsQuantity,
        roomsAllocationLength: stores.searchStore.searchWho.roomsAllocationLength,
        setOldSearchParam: stores.searchStore.setOldSearchParam,
        isOldParamSet: stores.searchStore.isOldParamSet,
        getPhrase: stores.layoutStore.getPhrase,
        isAutoAllocation: stores.searchStore.searchWho.isAutoAllocation,
        returnPath: stores.queryParamStore.returnPathFromUrl,
        referrer: stores.layoutStore.referrer,
        isMonthSearch: stores.searchStore.searchWhen.isMonthSearch,
        isMobileAppHideFeatures: stores.layoutStore.isMobileAppHideFeatures,
    }));

    const { fields: { EditSearch, EditSearchMobile, ToFieldLabel, WhenFieldLabel, WhoFieldLabel } = {} } =
        useSearchPodStore();

    const isMobile = useMobileViewport();

    const searchFromValue = useMemo(
        () => originsDisplayValue.main + (originsDisplayValue.add ? ' ' + originsDisplayValue.add : ''),
        [originsDisplayValue.main, originsDisplayValue.add],
    );
    const searchToValue = useMemo(
        () => destinationsDisplayValue.main + (destinationsDisplayValue.add ? ' ' + destinationsDisplayValue.add : ''),
        [destinationsDisplayValue.main, destinationsDisplayValue.add],
    );

    const searchWhenValue = useMemo(() => {
        if (isMonthSearch) {
            return formatDateL10n(from, DATE_FORMATS.fullMonthAndYear);
        }

        return formatDatesRange(from, to, DATE_FORMATS.DayAndMonthAbbr, DATE_FORMATS.DayMonthYearAbbr);
    }, [from, to, isMonthSearch]);

    const guestsValue = useMemo(() => {
        const guestsDictionaryValue =
            totalGuestsQuantity > 1
                ? getPhrase(SitecoreDictionary.GlobalsLabelsGuests)
                : getPhrase(SitecoreDictionary.GlobalsLabelsGuest);

        // TO DO think about moving to utils. There are 6 places of usage
        const roomsDictionaryValue =
            roomsAllocationLength > 1
                ? getPhrase(SitecoreDictionary.GlobalsLabelsRooms)
                : getPhrase(SitecoreDictionary.GlobalsLabelsRoom);

        return isAutoAllocation
            ? `${totalGuestsQuantity} ${guestsDictionaryValue}`
            : `${totalGuestsQuantity} ${guestsDictionaryValue}, ${roomsAllocationLength} ${roomsDictionaryValue}`;
    }, [roomsAllocationLength, isAutoAllocation, totalGuestsQuantity, getPhrase]);

    const onCallEdit = (edit?: boolean): void => {
        setOldParams();
        onEdit(edit);
    };

    const onClickSearchParameter = (dropdown: SearchBarDropdown): void => {
        if (isMobile) {
            onClick();
        } else {
            setOldParams();
            onOpenSearchBarDropdown(dropdown);
        }
    };

    const onClick = (): void => {
        onCallEdit(true);
    };

    const setOldParams = (): void => {
        !isOldParamSet && setOldSearchParam();
    };

    const fromParamClickHandler = (): void => {
        onClickSearchParameter(SearchBarDropdown.From);
    };

    const toParamClickHandler = (): void => {
        onClickSearchParameter(SearchBarDropdown.To);
    };

    const whenParamClickHandler = (): void => {
        onClickSearchParameter(SearchBarDropdown.When);
    };

    const whoParamClickHandler = (): void => {
        onClickSearchParameter(SearchBarDropdown.Who);
    };

    const editClickHandler = (): void => {
        onCallEdit();
    };

    const shouldShowBackToFlights = !!referrer && !!returnPath;

    return (
        <div className={styles.wrapper} data-tid='search-bar-preview' onClick={onClick} role='none'>
            <div className={styles.valuesBox}>
                {shouldShowBackToFlights && (
                    <div className='search-nav' data-tid='back-to-referrer-wrapper'>
                        <BackToReferrer returnPath={returnPath} />
                    </div>
                )}
                <div className={classNames(styles.valuesLeft, { [styles.valuesLeftApp]: isMobileAppHideFeatures })}>
                    <div className={classNames(styles.topRow, styles.row)}>
                        <SearchParameter
                            icon={<IconPlainDeparture />}
                            title={getPhrase(SitecoreDictionary.GlobalsLabelsFrom)}
                            value={searchFromValue}
                            valueDataTid='search-pod-preview-origin'
                            onClick={fromParamClickHandler}
                            boldOnMobile
                            valueClassName={classNames({ [styles.appSearchValue]: isMobileAppHideFeatures })}
                        />

                        <span className={styles.mobileSeparator}>{`${SPACE_UNICODE_CODE}-${SPACE_UNICODE_CODE}`}</span>

                        <SearchParameter
                            icon={<IconMapMarker />}
                            title={getFieldValue(ToFieldLabel)}
                            value={searchToValue}
                            valueDataTid='search-pod-preview-destination'
                            onClick={toParamClickHandler}
                            boldOnMobile
                            valueClassName={classNames({ [styles.appSearchValue]: isMobileAppHideFeatures })}
                        />
                    </div>

                    <div className={styles.row}>
                        <SearchParameter
                            icon={<IconCalendar />}
                            title={getFieldValue(WhenFieldLabel)}
                            value={searchWhenValue}
                            valueDataTid='search-pod-preview-travel-dates'
                            onClick={whenParamClickHandler}
                            valueClassName={classNames({ [styles.appSearchValue]: isMobileAppHideFeatures })}
                        />

                        <span className={styles.mobileSeparator}>{`,${SPACE_UNICODE_CODE}`}</span>

                        <SearchParameter
                            icon={<IconBed />}
                            title={getFieldValue(WhoFieldLabel)}
                            value={guestsValue}
                            valueDataTid='search-pod-preview-guests'
                            onClick={whoParamClickHandler}
                            valueClassName={classNames({ [styles.appSearchValue]: isMobileAppHideFeatures })}
                        />
                    </div>
                </div>
                <div className={classNames(styles.valuesRight, { [styles.valuesRightApp]: isMobileAppHideFeatures })}>
                    <div>
                        <Button
                            isText
                            isTransparent
                            id='search-parameters-edit'
                            onClick={editClickHandler}
                            dataTid='search-parameters-edit-button'
                            className={styles.editSearchParameters}
                        >
                            <IconPen />
                            {isMobile ? getFieldValue(EditSearchMobile) : getFieldValue(EditSearch)}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default observer(SearchParametersPreview);
