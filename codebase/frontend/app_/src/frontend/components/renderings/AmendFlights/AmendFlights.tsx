import { FunctionComponent, useEffect, useState } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { RichText } from '@sitecore-jss/sitecore-jss-react';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { IAmendTransport } from 'models/data/IAmendBookingFlights';
import { IAmendFlightsFields } from 'models/data/IAmendFlights';
import { isLoadedStatus, isLoadingMoreStatus, isLoadingStatus } from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import ErrorMessage from 'frontend/components/common//ErrorMessage';
import AlertBanner from 'frontend/components/common/AlertBanner/AlertBanner';
import Button from 'frontend/components/common/Button';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';
import Link from 'frontend/components/common/Link';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { FlightShimmer } from 'frontend/components/renderings/AlternativeFlights/components/FlightShimmer';
import AmendFlightCard from 'frontend/components/renderings/AmendFlights/components/AmendFlightCard/AmendFlightCard';
import { SeatDropOffPopup } from 'frontend/components/renderings/AmendFlights/components/SeatDropOffPopup/SeatsDropOffPopup';
import FlightsBasket from 'frontend/components/renderings/AmendmentBasket/components/FlightsBasket/FlightsBasket';

import AmendAlternativeFlights from './components/AmendAlternativeFlights/AmendAlternativeFlights';

import styles from './AmendFlights.module.scss';

export type TAmendFlightsProps = ISitecoreComponent<IAmendFlightsFields>;

export const AmendFlights: FunctionComponent<TAmendFlightsProps> = ({ fields, rendering }) => {
    const {
        alternativeFlights,
        selectedFlight,
        bookingRoutes,
        status,
        isLoadingFromPayload,
        errataFlightInfo,
        haveSelectedSeats,
        isScreenMedium,
        showSeatDropPopup,
        flightOffersCount,
        discountCode,
        currency,
        backLink,
        isPageHasTemplateId,
        getPhrase,
        initAmendFlightsPage,
        changeSelectedFlight,
        changePrevSelectedFlight,
        submitFlightChangeSelection,
        resetSelectedFlight,
        loadMoreFlights,
        setIsSeatDropPopupWasShown,
        setShowSeatDropPopup,
        trackFlightAmendment,
        getSetting,
        cancelFlightsValidation,
        isPrevSelectedFlightUnavailable,
        hideUnavailablePopup,
    } = useStore((stores: IHolidaysStores) => ({
        alternativeFlights: stores.amendFlightsStore.alternativeFlights,
        flightOffersCount: stores.amendFlightsStore.flightOffersCount,
        selectedFlight: stores.amendFlightsStore.selectedFlight,
        bookingRoutes: stores.amendFlightsStore.bookingRoutes,
        haveSelectedSeats: stores.amendFlightsStore.haveSelectedSeats,
        status: stores.amendFlightsStore.status,
        isLoadingFromPayload: stores.viewBookingStore.isLoadingBookingFromPayload,
        errataFlightInfo: stores.amendFlightsStore.errataFlightInfo,
        isScreenMedium: stores.appStore.isScreenMedium,
        showSeatDropPopup: stores.amendFlightsStore.showSeatDropPopup,
        discountCode: stores.viewBookingStore.booking?.discountCode,
        currency: stores.amendFlightsStore.currency,
        backLink: stores.amendFlightsStore.backLink,

        isPageHasTemplateId: stores.layoutStore.isPageHasTemplateId,
        getSetting: stores.layoutStore.getSetting,
        getPhrase: stores.layoutStore.getPhrase,
        initAmendFlightsPage: stores.amendFlightsStore.initAmendFlightsPage,
        changeSelectedFlight: stores.amendFlightsStore.changeSelectedFlight,
        changePrevSelectedFlight: stores.amendFlightsStore.changePrevSelectedFlight,
        submitFlightChangeSelection: stores.amendFlightsStore.submitFlightChangeSelection,
        resetSelectedFlight: stores.amendFlightsStore.resetSelectedFlight,
        loadMoreFlights: stores.amendFlightsStore.loadMoreAlternativeFlightsWithLivePrice,
        setIsSeatDropPopupWasShown: stores.amendFlightsStore.setIsSeatDropPopupWasShown,
        setShowSeatDropPopup: stores.amendFlightsStore.setShowSeatDropPopup,
        trackFlightAmendment: stores.trackingStore.trackFlightAmendment,
        cancelFlightsValidation: stores.amendFlightsStore.cancelFlightsValidation,
        isPrevSelectedFlightUnavailable: stores.amendFlightsStore.isPrevSelectedFlightUnavailable,
        hideUnavailablePopup: stores.amendFlightsStore.hideUnavailablePopup,
    }));

    const isMobile = useMobileViewport();

    const [hasError, setHasError] = useState(false);
    useEffect(() => {
        const { FiltersOrder, TimeFilters, SortDefault, SortOrder } = fields || {};
        initAmendFlightsPage(FiltersOrder, TimeFilters, SortOrder, SortDefault);

        return () => {
            if (!isPageHasTemplateId(SitecoreTemplateId.AmendFlightsPage)) {
                resetSelectedFlight();
                changePrevSelectedFlight(null);
                cancelFlightsValidation();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { SignpostIcon, SignpostText, SignpostTitle, PopupCancelCTA, PopupText, PopupTitle } = fields || {};

    const isFlightSelected = (flight: IAmendTransport) => {
        const isSelected =
            !!selectedFlight &&
            flight.routes.every(route => selectedFlight?.routes.some(selectedRoute => route.id === selectedRoute.id));

        isSelected && setHasError(false);

        return isSelected;
    };

    const dropSeatsGoToPayment = () => {
        setIsSeatDropPopupWasShown(true);
        setShowSeatDropPopup(false);
        setHasError(false);
        submitFlightChangeSelection();
    };

    const onContinue = () => {
        !!selectedFlight ? submitFlightChangeSelection() : setHasError(true);
    };

    const onChangeFlight = (value: IAmendTransport) => {
        changeSelectedFlight(value);
        changePrevSelectedFlight(null);
        trackFlightAmendment(
            EventTypes.PostBookingChangeFlightsSelect,
            value.routes,
            bookingRoutes,
            value.amendmentPaymentInfo,
        );
    };

    if (!fields) {
        return null;
    }

    const priceTooltipTextValue = (
        <>
            <RichText field={fields?.PriceTooltipText} />
            {!!discountCode &&
                !getSetting(SiteSettings.IsSeatsCalculationIncluded) &&
                ` ${fields?.PriceTooltipPromoSeatsText?.value || ''}`}
        </>
    );

    const isSeatSignpostAllowed = haveSelectedSeats && !!SignpostTitle && !!SignpostText;
    const isShowBookingFlight = isLoadedStatus(status) || isLoadingMoreStatus(status);

    //show opposite price of selected flight for default flight option
    const priceDifference = getAmendmentRoundedPrice((selectedFlight?.amendmentCharges ?? 0) * -1, true);

    return (
        <>
            <Placeholder name={PlaceholderNames.PriceJumpPopup} rendering={rendering} />
            <div className='amend-flights'>
                <section aria-label={fields?.Title?.value} data-tid='selected-flight'>
                    {!!fields?.Title && <Text field={fields.Title} tag='h2' className='amend-flights__title' />}
                    {!isScreenMedium && isSeatSignpostAllowed && (
                        <AlertBanner
                            collapsible
                            title={SignpostTitle?.value}
                            description={SignpostText?.value}
                            icon={SignpostIcon}
                        />
                    )}
                    {isLoadingStatus(status) && (
                        <div className='loading-shimmers mt-0'>
                            <FlightShimmer />
                        </div>
                    )}

                    {isShowBookingFlight && (
                        <AmendFlightCard
                            csMask
                            routes={bookingRoutes}
                            isSelected={!selectedFlight}
                            onClickSelect={resetSelectedFlight}
                            errataFlightInfo={errataFlightInfo}
                            cardClassName={styles.yourFlightsCard}
                            priceDifference={priceDifference}
                            currency={currency}
                        />
                    )}
                </section>
                {isScreenMedium && isSeatSignpostAllowed && (
                    <InfoBlock
                        title={SignpostTitle}
                        text={SignpostText}
                        icon={SignpostIcon}
                        textClass={styles.signpostText}
                    />
                )}
                <AmendAlternativeFlights
                    flights={alternativeFlights}
                    status={status}
                    totalFlights={flightOffersCount}
                    title={fields?.AlternativeFlightsTitle?.value}
                    fields={fields}
                    isFlightSelected={isFlightSelected}
                    onChangeFlight={onChangeFlight}
                    onLoadMoreClick={loadMoreFlights}
                    priceTooltipText={priceTooltipTextValue}
                    currency={currency}
                    rendering={rendering}
                />
                {!isMobile && (
                    <div className='amend-flights__continue'>
                        <Link href={backLink} legacyBehavior>
                            {getPhrase(SitecoreDictionary.AmendBookingButtonsGoBackNoChanges)}
                        </Link>
                        <Button hasDisabledStyles={!selectedFlight} isMedium type='button' onClick={onContinue}>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                        </Button>
                    </div>
                )}
                {hasError && (
                    <div className='amend-flights__error'>
                        <ErrorMessage
                            message={getPhrase(SitecoreDictionary.AmendFlightsErrorsSelectFlightToContinue)}
                            icon={<SVGWarningFilled />}
                        />
                    </div>
                )}
            </div>
            {isMobile && (
                <Placeholder
                    name={PlaceholderNames.MobileBasket}
                    rendering={rendering}
                    handleSubmit={submitFlightChangeSelection}
                    price={getAmendmentRoundedPrice(selectedFlight?.amendmentCharges ?? 0)}
                    hasOptionSelected={!!selectedFlight}
                    applyNegativeMargin
                    backLink={backLink}
                >
                    <FlightsBasket />
                </Placeholder>
            )}
            {showSeatDropPopup && (
                <SeatDropOffPopup
                    onClose={() => setShowSeatDropPopup(false)}
                    onContinue={dropSeatsGoToPayment}
                    title={PopupTitle}
                    description={PopupText}
                    backCTA={PopupCancelCTA}
                />
            )}
            {isPrevSelectedFlightUnavailable && (
                <Placeholder
                    name={PlaceholderNames.ProductUnavailablePopup}
                    rendering={rendering}
                    onClose={hideUnavailablePopup}
                />
            )}
            {isLoadingFromPayload && (
                <OverlaySpinner header={getPhrase(SitecoreDictionary.GlobalsLabelsValidatingPackage)} />
            )}
        </>
    );
};

export default observer(AmendFlights);
