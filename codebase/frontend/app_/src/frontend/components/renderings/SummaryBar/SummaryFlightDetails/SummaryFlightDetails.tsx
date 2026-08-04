import React, { FunctionComponent, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { useLuxuryInternalFlight } from 'frontend/hooks/useLuxuryInternalFlight';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { getSingleRoute } from 'frontend/utils/route.utils';
import { getCurrencyFormatOptions } from 'frontend/utils/summaryDetails.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IExtraLuggageInfo, ILuggageInfoItem } from 'models/data/IFlightExtras';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ISelectedSeat, ISelectedSeatDetails } from 'models/data/ISeatMapStore';
import { NUMBER_OF_ROUTES, RouteDirection } from 'models/enum/RouteDirection';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import { SeatType } from 'models/enum/SeatType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { GuestInfo } from 'models/GuestInfo';
import ReadMoreButton from 'frontend/components/common/ReadMoreButton';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import SvgFlightsLined from 'frontend/components/icons-new/FlightsLined';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';
import summaryDetailsStyles from 'frontend/components/renderings/SummaryBar/SummaryDetails/SummaryDetails.module.scss';
import SummaryEditButton from 'frontend/components/renderings/SummaryBar/SummaryEditButton/SummaryEditButton';

import flightDetailsStyle from './SummaryFlightDetails.module.scss';

interface IExtraItem {
    key: string;
    name: string;
    price: number;
    quantity: number;
}

interface ISummaryFlightDetailsProps extends ISummaryBarSitecoreFields {
    onEditClick?: () => void;
}

const formatDate = (route: Nullable<IRoute>): string =>
    route
        ? `${formatDateL10n(route?.depDate, DATE_FORMATS.fullDate)} • ${formatDateL10n(
              route?.depDate,
              DATE_FORMATS.time,
          )} - ${formatDateL10n(route?.arrDate, DATE_FORMATS.time)}`
        : '';

const getInfantsPRAM = (infants: GuestInfo[], pramSitecoreField: string): IExtraItem[] => {
    if (!infants?.length) return [];

    return [
        {
            quantity: infants.length,
            name: pramSitecoreField,
            price: 0,
            key: pramSitecoreField,
        },
    ];
};

const getLuggageExtraItems = (extraLuggageInfo: IExtraLuggageInfo): IExtraItem[] => {
    if (!extraLuggageInfo) return [];

    const mergedItems = extraLuggageInfo.items.reduce<ILuggageInfoItem[]>((acc, item) => {
        const existingItem = acc.find(i => i.itemCode === item.itemCode);

        if (existingItem) {
            existingItem.quantity += item.quantity;
            existingItem.price += item.price;
        } else {
            acc.push({ ...item });
        }

        return acc;
    }, []);

    return mergedItems.map(
        (item, index): IExtraItem => ({
            quantity: item.quantity / NUMBER_OF_ROUTES,
            name: item.name,
            price: item.price,
            key: index.toString(),
        }),
    );
};

const SummaryFlightDetails: FunctionComponent<ISummaryFlightDetailsProps> = ({
    FlightSectionExtrasDropdown,
    CommonFieldsItemIncluded,
    FlightSectionTitle,
    FlightSectionToDestination,
    FlightSectionSeatTypeExtraLegroom,
    FlightSectionSeatTypeStandard,
    FlightSectionSeatTypeRearStandard,
    FlightSectionSeatTypeUpFront,
    FlightSectionExtrasPram,
    EnableEditButtons,
    onEditClick,
}) => {
    const { formatMoney, isScreenLessMedium, offer, packageInfo, infants, extraLuggage } = useStore(
        (stores: TStores) => ({
            formatMoney: stores.marketStore.formatMoney,
            isScreenLessMedium: stores.appStore.isScreenLessMedium,
            offer: stores.bookingStore.selectedOffer,
            packageInfo: stores.bookingStore.packageInfo,
            infants: stores.guestDetailsStore.infants,
            extraLuggage: stores.bookingStore.extraLuggage,
        }),
    );

    const isLuxuryInternalFlight = useLuxuryInternalFlight();
    const { canAddHoldLuggage, isLCBAddingUnavailable } = extraLuggage;
    const isEditButtonHidden =
        !EnableEditButtons?.value || isLuxuryInternalFlight || (!canAddHoldLuggage && isLCBAddingUnavailable);

    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    if (!offer) return null;

    const onReadMoreButtonClick = (): void => {
        setIsExpanded(!isExpanded);
    };

    const formatAirports = (route: Nullable<IRoute>): string => {
        if (route == null) return '';

        return Tokenizer.replaceTokens(FlightSectionToDestination.value, {
            [Tokens.Departure]: route.depName,
            [Tokens.Return]: route.arrName,
        });
    };

    const formatRouteData = (route: Nullable<IRoute>): [date: string, airports: string] => [
        formatDate(route),
        formatAirports(route),
    ];

    const getFlightItems = (
        seatSelection: ISelectedSeat[] | undefined,
        offer: IOfferWithoutAltBoards,
    ): (IExtraItem[] | undefined)[] => {
        if (!seatSelection) return [];

        return (
            seatSelection.map(selectedItem =>
                selectedItem.seats ? combineSeatsByPriceBand(selectedItem.seats, offer) : [],
            ) ?? []
        );
    };

    const combineSeatsByPriceBand = (seats: ISelectedSeatDetails[], offer: IOfferWithoutAltBoards): IExtraItem[] =>
        seats?.reduce((acc: IExtraItem[], seat) => {
            const priceBand = seat.priceBand ?? SeatType.Standard;
            const existingItem = acc.find(i => i.key === priceBand);
            const price =
                containsLuxuryPromoCode(offer?.promoCollections) && priceBand === SeatType.Standard ? 0 : seat.price;

            if (existingItem) {
                existingItem.quantity += 1;
                existingItem.price += price ?? 0;
            } else {
                acc.push({
                    quantity: 1,
                    name: formatPriceBandName(priceBand),
                    price: price ?? 0,
                    key: priceBand,
                } as IExtraItem);
            }

            return acc;
        }, []);

    const formatPriceBandName = (priceBand: SeatType): string => {
        switch (priceBand) {
            case SeatType.ExtraLegroom:
                return FlightSectionSeatTypeExtraLegroom.value;
            case SeatType.UpFront:
                return FlightSectionSeatTypeUpFront.value;
            case SeatType.RearStandard:
                return FlightSectionSeatTypeRearStandard.value;
            default:
                return FlightSectionSeatTypeStandard.value;
        }
    };

    const renderExtra = (item: IExtraItem): JSX.Element => {
        const formattedExtraName = `${item.quantity + ' x '} ${item.name}`;
        const itemNameForDataTid = item.name.replaceAll(' ', '-').toLowerCase();

        return (
            <div
                data-tid={`luggage-item-container-${item.name}`}
                data-key={item.key}
                key={item.key}
                className={flightDetailsStyle.extra}
            >
                <p data-tid={`luggage-item-label-${itemNameForDataTid}`} className={flightDetailsStyle.extraName}>
                    {formattedExtraName}
                </p>
                <p data-tid={`luggage-item-price-${itemNameForDataTid}`}>
                    {item.price == 0
                        ? CommonFieldsItemIncluded.value
                        : formatMoney(item.price, getCurrencyFormatOptions(packageInfo?.paymentInfo?.currency))}
                </p>
            </div>
        );
    };

    const renderDirection = (direction: RouteDirection, airports: string): JSX.Element => (
        <>
            <span className={flightDetailsStyle.direction}>
                <RichTextDictionary
                    tag='span'
                    dictionaryKey={
                        direction === RouteDirection.Outbound
                            ? SitecoreDictionary.SeatMapLabelsOutbound
                            : SitecoreDictionary.SeatMapLabelsReturn
                    }
                />
                {': '}
            </span>
            {airports}
        </>
    );

    const outbound: Nullable<IRoute> = getSingleRoute(
        offer.transport.routes.filter(el => el.direction === RouteDirection.Outbound),
    );
    const inbound: Nullable<IRoute> = getSingleRoute(
        offer.transport.routes.filter(el => el.direction === RouteDirection.Inbound),
    );

    const shouldRenderForLux = (): boolean => {
        if (!containsLuxuryPromoCode(offer?.promoCollections)) return true;

        return outbound ? outbound.isExt : true;
    };

    const [outboundDepartureDate, outboundAirports] = formatRouteData(outbound);
    const [inboundDepartureDate, inboundAirports] = formatRouteData(inbound);
    const extraLuggageInfo = packageInfo?.extraLuggageInfo ?? offer?.extraLuggageInfo;
    const luggageExtraItems = getLuggageExtraItems(extraLuggageInfo);

    const infantsPRAM = getInfantsPRAM(infants, FlightSectionExtrasPram.value);
    const extraItems = [...luggageExtraItems, ...infantsPRAM];
    const shouldDisplayDesktopDropdown = extraItems.length > 0 && shouldRenderForLux();
    const seatSelection = packageInfo?.seatSelection ?? offer?.seatSelection;
    const [outboundFlightItems, inboundFlightItems] = getFlightItems(seatSelection, offer);

    return (
        <div
            className={classNames(summaryDetailsStyles.category, flightDetailsStyle.categoryFlights)}
            data-tid='summary-bar-flight-details'
        >
            <div className={flightDetailsStyle.title}>
                <SvgFlightsLined />
                <h3 data-tid='flight-details-title'>{FlightSectionTitle.value}</h3>
            </div>
            <div>
                <div className={flightDetailsStyle.item}>
                    <p data-tid='flight-details-outbound-direction'>
                        {outboundAirports && renderDirection(RouteDirection.Outbound, outboundAirports)}
                    </p>
                    <p className={flightDetailsStyle.date} data-tid='flight-details-outbound-date'>
                        {outboundDepartureDate}
                    </p>
                    <div data-tid='flight-details-outbound-items'>
                        {outboundFlightItems?.map(item => renderExtra(item))}
                    </div>
                </div>
                <div className={flightDetailsStyle.item}>
                    <p data-tid='flight-details-inbound-direction'>
                        {inboundAirports && renderDirection(RouteDirection.Inbound, inboundAirports)}
                    </p>
                    <p className={flightDetailsStyle.date} data-tid='flight-details-inbound-date'>
                        {inboundDepartureDate}
                    </p>
                    <div data-tid='flight-details-inbound-items'>
                        {inboundFlightItems?.map(item => renderExtra(item))}
                    </div>
                </div>
                {!isScreenLessMedium ? (
                    shouldDisplayDesktopDropdown && (
                        <>
                            <div
                                className={classNames(
                                    summaryDetailsStyles.titleWrapper,
                                    flightDetailsStyle.luggageWrapper,
                                )}
                            >
                                <div
                                    className={classNames(
                                        'read-more-box',
                                        flightDetailsStyle.item,
                                        flightDetailsStyle.extraDropdown,
                                    )}
                                >
                                    <ReadMoreButton
                                        isReadLess={isExpanded}
                                        onClick={onReadMoreButtonClick}
                                        readLessText={FlightSectionExtrasDropdown.value}
                                        readMoreText={FlightSectionExtrasDropdown.value}
                                        dataTid='flight-details-luggage-button'
                                    />
                                </div>
                                <SummaryEditButton
                                    dataTid='flight-details-edit'
                                    scrollAnchorId={ScrollAnchorId.CabinBags}
                                    onClick={onEditClick}
                                    isHidden={isEditButtonHidden}
                                />
                            </div>
                            <div className={classNames(!isExpanded && 'd-none')} data-tid='flight-details-extras'>
                                {extraItems.map(item => renderExtra(item))}
                            </div>
                        </>
                    )
                ) : (
                    <div className={classNames(flightDetailsStyle.item)} data-tid='flight-details-extras'>
                        {extraItems.map(item => renderExtra(item))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default observer(SummaryFlightDetails);
