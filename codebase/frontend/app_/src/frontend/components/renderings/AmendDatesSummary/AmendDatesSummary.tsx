import { FC, useEffect } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getBookingRoute } from 'frontend/utils/viewBooking.utils';
import { IBenefit } from 'models/data/ISeatsAndBagsFields';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { RouteDirection } from 'models/enum/RouteDirection';
import { ScreenViews } from 'models/enum/ScreenViews';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import AmendPageHeader from 'frontend/components/common/AmendPageHeader/AmendPageHeader';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import OtherDepartureAirportsPopup from 'frontend/components/renderings/AmendFlights/components/OtherDepartureAirportsPopup/OtherDepartureAirportsPopup';
import DatesBasket from 'frontend/components/renderings/AmendmentBasket/components/DatesBasket/DatesBasket';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';
import AmendBookingErrorPopup from 'frontend/components/renderings/ViewBooking/components/AmendBookingErrorPopup';

import AmendDatesSummaryContinueBtn from './components/AmendDatesSummaryContinueBtn/AmendDatesSummaryContinueBtn';
import AmendDatesSummaryFlight from './components/AmendDatesSummaryFlight/AmendDatesSummaryFlight';
import AmendSummaryHotel from './components/AmendDatesSummaryHotel/AmendDatesSummaryHotel';
import AmendDatesSummaryPrices from './components/AmendDatesSummaryPrices/AmendDatesSummaryPrices';
import AmendDatesSummaryRoom from './components/AmendDatesSummaryRoom/AmendDatesSummaryRoom';
import AmendDatesSummarySeats from './components/AmendDatesSummarySeats/AmendDatesSummarySeats';
import AmendDatesSummaryTransport from './components/AmendDatesSummaryTransport/AmendDatesSummaryTransport';
import AmendSummaryStickyHeader from './components/AmendSummaryStickyHeader/AmendSummaryStickyHeader';

import styles from './AmendDatesSummary.module.scss';

export interface IAmendDatesSummarySeatsPopupFields {
    PopupIcon: ISitecoreField<ISitecoreImage>;
    SeatsNotAvailableDescription: ISitecoreField<string>;
    SeatsPopupPrimaryCTA: ISitecoreField<string>;
    SeatsPopupSecondaryCTA: ISitecoreField<string>;
    SeatsPopupTitle: ISitecoreField<string>;
    SeatsPriceChangedDescription: ISitecoreField<string>;
}

export interface IAmendSummarySeatsFields extends IAmendDatesSummarySeatsPopupFields {
    AddSeatsCTA: ISitecoreField<string>;
    BagsLabel: ISitecoreField<string>;
    FallbackBenefit: ISitecoreCompositeField<IBenefit>;
    InboundLabel: ISitecoreField<string>;
    OutboundLabel: ISitecoreField<string>;
    SeatsIcon: ISitecoreField<ISitecoreImage>;
    SeatsTitle: ISitecoreField<string>;
    SeatsUnavailableDescription: ISitecoreField<string>;
    SeatsUnavailableTitle: ISitecoreField<string>;
}

export interface IAmendDatesSummaryFields extends IAmendSummarySeatsFields, ICabinBagsInfoFields, ILuggageInfoFields {
    AdditionalCostLabel: ISitecoreField<string>;
    ChangeFeeLabel: ISitecoreField<string>;
    CostTooltipContent: ISitecoreField<string>;
    FallbackHotelImage: ISitecoreField<ISitecoreImage>;
    FlightIcon: ISitecoreField<ISitecoreImage>;
    FlightTitle: ISitecoreField<string>;
    IsAttentionMessageEnabled: ISitecoreField<boolean>;
    IsStickySummaryEnabled: ISitecoreField<boolean>;
    LinkHotelLabel: ISitecoreField<string>;
    NewCostLabel: ISitecoreField<string>;
    PreviousCostLabel: ISitecoreField<string>;
    RefundLabel: ISitecoreField<string>;
    RoomIcon: ISitecoreField<ISitecoreImage>;
    RoomPluralLabel: ISitecoreField<string>;
    RoomSingleLabel: ISitecoreField<string>;
    RoomTitle: ISitecoreField<string>;
    ShowCostTooltip: ISitecoreField<boolean>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    TransferTitle: ISitecoreField<string>;
}

const AmendDatesSummary: FC<ISitecoreComponent<IAmendDatesSummaryFields>> = ({ fields, rendering }) => {
    const {
        initiateSummaryPage,
        isOtherDepartureAirportsPopupShown,
        booking,
        isInitialDataLoading,
        isLoadingBookingFromPayload,
        isSummaryRequestError,
        setIsSummaryRequestError,
        getPhrase,
        selectedOfferPrice,
        isValidatedOfferUnavailable,
        redirectToAmendDatesPage,
        clearValidatedSeats,
        confirmChosenDates,
        feePP,
        formatMoney,
    } = useStore(
        ({
            amendDatesStore,
            amendFlightsStore,
            layoutStore,
            viewBookingStore,
            routerStore,
            seatMapStore,
            marketStore,
        }: IHolidaysStores) => ({
            initiateSummaryPage: amendDatesStore.initiateSummaryPage,
            changeDatesPrices: amendDatesStore.offerPrices,
            isOtherDepartureAirportsPopupShown: amendFlightsStore.isOtherDepartureAirportsPopupShown,
            booking: amendDatesStore.booking,
            isInitialDataLoading: amendDatesStore.isInitialDataLoading,
            isLoadingBookingFromPayload: viewBookingStore.isLoadingBookingFromPayload,
            isSummaryRequestError: amendDatesStore.isSummaryRequestError,
            setIsSummaryRequestError: amendDatesStore.setIsSummaryRequestError,
            getPhrase: layoutStore.getPhrase,
            selectedOfferPrice: amendDatesStore.offerPrices?.amendmentDatesCharges,
            isValidatedOfferUnavailable: amendDatesStore.isValidatedOfferUnavailable,
            redirectToAmendDatesPage: routerStore.redirectToAmendDatesPage,
            clearValidatedSeats: seatMapStore.clearValidatedSeats,
            confirmChosenDates: amendDatesStore.confirmChosenDates,
            feePP: amendDatesStore.feePP,
            formatMoney: marketStore.formatMoney,
        }),
    );

    const isMobile = useMobileViewport();

    useEffect(() => {
        initiateSummaryPage();

        return () => {
            clearValidatedSeats();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!fields) {
        return null;
    }

    if (isInitialDataLoading || isLoadingBookingFromPayload) {
        return <OverlaySpinner header={getPhrase(SitecoreDictionary.AmendDatesLabelsValidatingDates)} />;
    }

    if (!booking) {
        return null;
    }

    const {
        Title,
        Subtitle,
        IsStickySummaryEnabled,
        IsAttentionMessageEnabled,
        FallbackHotelImage,
        LinkHotelLabel,
        FlightTitle,
        FlightIcon,
        RoomTitle,
        RoomIcon,
        TransferTitle,
    } = fields;

    const { depName: departureAirportName = '' } = getBookingRoute(booking, RouteDirection.Outbound) || {};

    const changeFeeInfoRendering = rendering.placeholders[PlaceholderNames.ChangeFeeInfo]?.[0];

    const isRenderingChangeFeeInfo = !!feePP && !!changeFeeInfoRendering;

    const ChangeFeeTitle = changeFeeInfoRendering?.fields?.Title;

    const changeFeeDescription = Tokenizer.replaceToken(
        changeFeeInfoRendering?.fields?.Description.value,
        Tokens.Price,
        formatMoney(feePP!, { trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger }),
    );

    return (
        <>
            <Placeholder name={PlaceholderNames.PriceJumpPopup} rendering={rendering} />
            <Placeholder name={PlaceholderNames.UnAvailableFlowPopup} rendering={rendering} />

            <div className={styles.container}>
                {IsStickySummaryEnabled?.value && (
                    <AmendSummaryStickyHeader
                        fields={fields}
                        {...(isRenderingChangeFeeInfo && {
                            calloutProps: {
                                content: (
                                    <div className={styles.changeFeeCalloutContent}>
                                        <Text field={ChangeFeeTitle} />{' '}
                                        <Text field={{ value: changeFeeDescription ?? '' }} />
                                    </div>
                                ),
                                isShownOnHover: true,
                                orientation: CalloutOrientation.Bottom,
                                position: CalloutPosition.Right,
                            },
                        })}
                    />
                )}
                <AmendPageHeader
                    title={Title}
                    subtitle={Subtitle}
                    isAttentionMessageOn={IsAttentionMessageEnabled?.value}
                    breadcrumbRootPath={SitePath.AmendDates}
                    rendering={rendering}
                />
                <ComponentWrapper>
                    <div
                        className={classNames(styles.amendSummaryDates, {
                            [styles.withFeeBanner]: !!feePP,
                        })}
                        data-tid='amend-dates-summary-block'
                    >
                        <AmendSummaryHotel
                            fallbackHotelImage={FallbackHotelImage?.value.src}
                            linkLabel={LinkHotelLabel?.value}
                            className={styles.hotel}
                        />

                        {isMobile && (
                            <>
                                <AmendDatesSummaryPrices
                                    tidPostfix={ScreenViews.Mobile}
                                    fields={fields}
                                    className={styles.pricesMobile}
                                />

                                <Placeholder name={PlaceholderNames.ChangeFeeInfo} rendering={rendering} />
                            </>
                        )}

                        <div className={styles.mainContent}>
                            <AmendDatesSummaryFlight title={FlightTitle} icon={FlightIcon} />
                            <AmendDatesSummarySeats fields={fields} rendering={rendering} />
                            <AmendDatesSummaryRoom title={RoomTitle} icon={RoomIcon} />
                            <AmendDatesSummaryTransport title={TransferTitle} />

                            {!isMobile && (
                                <>
                                    <AmendDatesSummaryPrices
                                        tidPostfix={ScreenViews.Desktop}
                                        fields={fields}
                                        className={styles.pricesDesktop}
                                    />

                                    <Placeholder name={PlaceholderNames.ChangeFeeInfo} rendering={rendering} />
                                </>
                            )}
                        </div>
                    </div>

                    <div className={styles.continueBtn}>
                        <AmendDatesSummaryContinueBtn />
                    </div>
                </ComponentWrapper>
                {isSummaryRequestError && <AmendBookingErrorPopup onClose={() => setIsSummaryRequestError(false)} />}

                {isOtherDepartureAirportsPopupShown && (
                    <OtherDepartureAirportsPopup airportName={departureAirportName} />
                )}

                {isValidatedOfferUnavailable && (
                    <Placeholder
                        name={PlaceholderNames.ProductUnavailablePopup}
                        onClose={redirectToAmendDatesPage}
                        rendering={rendering}
                    />
                )}
            </div>
            {isMobile && (
                <Placeholder
                    name={PlaceholderNames.MobileBasket}
                    rendering={rendering}
                    price={selectedOfferPrice}
                    hasOptionSelected
                    handleSubmit={confirmChosenDates}
                    {...(isRenderingChangeFeeInfo && {
                        calloutProps: {
                            drawerTitleClassName: styles.priceDrawerTitle,
                            isDrawerVariant: true,
                            content: (
                                <Text
                                    field={{ value: changeFeeDescription ?? '' }}
                                    className={styles.priceDrawerText}
                                />
                            ),
                            drawerTitle: ChangeFeeTitle,
                        },
                    })}
                >
                    <DatesBasket />
                </Placeholder>
            )}
        </>
    );
};

export default observer(AmendDatesSummary);
