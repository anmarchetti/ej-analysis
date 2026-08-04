import { FunctionComponent, useEffect } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { GenericValues } from 'models/data/tracking/AmendEvent';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import AmendPageHeader from 'frontend/components/common/AmendPageHeader/AmendPageHeader';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import ViewCalendar from 'frontend/components/renderings/AmendDates/components/ViewCalendar/ViewCalendar';
import DatesBasket from 'frontend/components/renderings/AmendmentBasket/components/DatesBasket/DatesBasket';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';
import WarningPopup from 'frontend/components/renderings/WarningPopup/WarningPopup';

import SummaryHeader from './components/SummaryHeader/SummaryHeader';

import styles from './AmendDates.module.scss';

export interface IAmendDatesFields {
    AttentionPopupCloseCTALabel: ISitecoreField<string>;
    AttentionPopupSubtext: ISitecoreField<string>;
    AttentionPopupTitle: ISitecoreField<string>;
    Phone: ISitecoreField<string>;
    PopupCTA: ISitecoreField<string>;
    PopupIcon: ISitecoreField<ISitecoreImage>;
    PopupSubtext: ISitecoreField<string>;
    PopupTitle: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    isAttentionMessageEnabled: ISitecoreField<boolean>;
    isStickySummaryEnabled: ISitecoreField<boolean>;
}

interface IAmendDatesProps {
    fields: IAmendDatesFields;
    rendering: any;
}

const AmendDates: FunctionComponent<IAmendDatesProps> = ({ fields, rendering }) => {
    const {
        getPhrase,
        initAmendDatesPage,
        numberOfNights,
        isSelectedDatesUnavailable,
        refreshAvailableDates,
        isSubmitDatesLoading,
        breakSubmitRequest,
        trackNewDateSelectionEvent,
        isAlternativePackagePopupShown,
        setIsAlternativePackagePopupShown,
        redirectToAmendDatesSummaryPage,
        selectedDepartureDate,
        isDatesChanged,
        submitDates,
    } = useStore((stores: IHolidaysStores) => ({
        initAmendDatesPage: stores.amendDatesStore.initAmendDatesPage,
        numberOfNights: stores.amendDatesStore.numberOfNights,
        isSelectedDatesUnavailable: stores.amendDatesStore.isSelectedDatesUnavailable,
        refreshAvailableDates: stores.amendDatesStore.refreshAvailableDates,
        selectedDepartureDate: stores.amendDatesStore.selectedDepartureDate,
        setSelectedMonth: stores.amendDatesStore.setSelectedMonth,
        selectedDates: stores.amendDatesStore.selectedDates,
        getPhrase: stores.layoutStore.getPhrase,
        isSubmitDatesLoading: stores.amendDatesStore.isSubmitDatesLoading,
        breakSubmitRequest: stores.amendDatesStore.breakSubmitRequest,
        trackNewDateSelectionEvent: stores.trackingStore.trackNewDateSelectionEvent,
        isAlternativePackagePopupShown: stores.amendDatesStore.isAlternativePackagePopupShown,
        setIsAlternativePackagePopupShown: stores.amendDatesStore.setIsAlternativePackagePopupShown,
        redirectToAmendDatesSummaryPage: stores.routerStore.redirectToAmendDatesSummaryPage,
        isDatesChanged: stores.amendDatesStore.isDatesChanged,
        submitDates: stores.amendDatesStore.submitDates,
    }));

    const isMobile = useMobileViewport();

    const numberOfNightsLabel =
        numberOfNights &&
        Tokenizer.replaceToken(
            getPhrase(
                numberOfNights > 1
                    ? SitecoreDictionary.GlobalsLabelsNumberOfNights
                    : SitecoreDictionary.GlobalsLabelsNumberOfNight,
            ),
            Tokens.Count,
            numberOfNights.toString(),
        );

    const onUnavailablePopupClose = async () => {
        trackNewDateSelectionEvent({
            genericValue1: GenericValues.NoMatchingDates,
            genericValue2: GenericValues.BackToCalendar,
        });
        await refreshAvailableDates();
    };

    const onAttentionPopupClose = () => {
        trackNewDateSelectionEvent({
            genericValue1: GenericValues.AlternativeMatchingAvailability,
            genericValue2: GenericValues.BackToCalendar,
        });
        setIsAlternativePackagePopupShown(false);
        refreshAvailableDates(selectedDepartureDate);
    };

    const onAttentionPopupAgree = () => {
        trackNewDateSelectionEvent({
            genericValue1: GenericValues.AlternativeMatchingAvailability,
            genericValue2: GenericValues.Confirm,
        });
        setIsAlternativePackagePopupShown(false);
        redirectToAmendDatesSummaryPage();
    };

    useEffect(() => {
        initAmendDatesPage();

        return () => {
            breakSubmitRequest();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showStickySummary = !!fields?.isStickySummaryEnabled?.value && !!numberOfNightsLabel;
    const phoneNumber = fields?.Phone?.value || '';

    const trackPhoneNumberClick = (e: MouseEvent) => {
        if ((e.target as HTMLAnchorElement).href.includes('tel:')) {
            trackNewDateSelectionEvent({
                genericValue1: GenericValues.NoMatchingDates,
                genericValue2: GenericValues.HelpCallCentre,
            });
        }
    };
    const description = Tokenizer.replaceToken(
        fields?.PopupSubtext?.value,
        Tokens.Number,
        phoneNumber ? `<a class='btn-txt' href='tel:${phoneNumber}'>${phoneNumber}</a>` : '',
    );

    return (
        <div className={styles.amendDates}>
            {isSubmitDatesLoading && (
                <OverlaySpinner header={getPhrase(SitecoreDictionary.AmendDatesLabelsValidatingDates)} />
            )}

            {showStickySummary && !isMobile && <SummaryHeader numberOfNightsLabel={numberOfNightsLabel} />}

            <AmendPageHeader
                title={fields.Title}
                subtitle={fields.Subtitle}
                isAttentionMessageOn={fields.isAttentionMessageEnabled?.value}
                rendering={rendering}
                isBackgroundGrey={!isMobile}
            />

            <ComponentWrapper>
                <ViewCalendar />

                {isMobile && (
                    <Placeholder
                        name={PlaceholderNames.MobileBasket}
                        rendering={rendering}
                        showPrice={false}
                        hasOptionSelected={isDatesChanged}
                        handleSubmit={submitDates}
                        applyNegativeMargin
                    >
                        <DatesBasket />
                    </Placeholder>
                )}
            </ComponentWrapper>
            {isAlternativePackagePopupShown && (
                <WarningPopup
                    title={fields?.AttentionPopupTitle}
                    description={fields.AttentionPopupSubtext}
                    icon={fields?.PopupIcon}
                    ctaText={{ value: getPhrase(SitecoreDictionary.GlobalsButtonsContinue) }}
                    onClose={onAttentionPopupAgree}
                    secondaryCtaText={fields.AttentionPopupCloseCTALabel}
                    onSecondaryCtaClick={onAttentionPopupClose}
                    id='alternative-package-popup'
                />
            )}
            {isSelectedDatesUnavailable && (
                <WarningPopup
                    onDescriptionLinkClick={trackPhoneNumberClick}
                    title={fields?.PopupTitle}
                    description={{
                        value: description,
                    }}
                    icon={fields?.PopupIcon}
                    ctaText={fields?.PopupCTA}
                    onClose={onUnavailablePopupClose}
                    id='dates-unavailable-popup'
                />
            )}
        </div>
    );
};

export default observer(AmendDates);
