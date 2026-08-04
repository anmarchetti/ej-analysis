import React from 'react';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { formatDatesRange } from 'frontend/utils/date.utils';
import { getRoute } from 'frontend/utils/route.utils';
import { IOffer } from 'models/data/IOffer';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Link from 'frontend/components/common/Link';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import IconChevronRight from 'frontend/components/icons/ChevronRight';
import DepartureFilled from 'frontend/components/icons-new/DepartureFilled';
import SvgTick from 'frontend/components/icons-new/Tick';

import { buildUrl } from './OtherRoutesItem.utils';

interface IOtherRoutesItemProps {
    offer: IOffer;
    className?: string;
    isMobile?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
    openInNewTab?: boolean;
}

const OtherRoutesItem = ({ offer, isSelected, isMobile, className, openInNewTab, onSelect }: IOtherRoutesItemProps) => {
    const { getPhrase, hotelDetailsUrl, buildHotelDetailsQuery, formatMoney, isPromoPage, currentPath } = useStore(
        stores => ({
            getPhrase: stores.layoutStore.getPhrase,
            hotelDetailsUrl: stores.routerStore.hotelDetailsUrl,
            buildHotelDetailsQuery: stores.queryParamStore.buildHotelDetailsQuery,
            formatMoney: stores.marketStore.formatMoney,
            isPromoPage: stores.layoutStore.isPromoPage,
            currentPath: stores.layoutStore.currentPath,
        }),
    );

    const routeOutbound = getRoute(offer, RouteDirection.Outbound);
    const routeInbound = getRoute(offer, RouteDirection.Inbound);

    if (!routeOutbound) return null;

    const url = buildUrl({
        offer,
        routeOutbound,
        routeInbound,
        isPromoPage,
        currentPath,
        hotelDetailsUrl,
        buildHotelDetailsQuery,
    });

    const depAirport = `${routeOutbound.depName} (${routeOutbound.depPt})`;
    const outboundTime = formatDatesRange(routeOutbound.depDate, routeOutbound.arrDate, DATE_FORMATS.time);
    const inboundTime = routeInbound
        ? formatDatesRange(routeInbound.depDate, routeInbound.arrDate, DATE_FORMATS.time)
        : '';

    const currencyOptions = { currency: offer.currency?.code, maximumFractionDigits: 0 };
    const price = formatMoney(offer.price, currencyOptions);
    const pricePP = formatMoney(offer.pricePP, currencyOptions);
    const isPricePPShown = offer.price !== offer.pricePP;

    return (
        <Link href={url} legacyBehavior>
            <a
                className={classNames('table-row', isMobile && 'mobile', isSelected && 'selected', className)}
                target={openInNewTab ? '_blank' : undefined}
                onClick={onSelect}
            >
                {isMobile ? (
                    <div className='table-col align-left'>
                        <div>
                            <div data-tid='airport-name'>
                                <strong>{depAirport}</strong>
                            </div>
                            <div>
                                <span className='flight' data-tid='other-routes-depart-time'>
                                    <DepartureFilled />
                                    {outboundTime}
                                </span>
                                <span className='flight' data-tid='other-routes-return-time'>
                                    <DepartureFilled className='icon--reflect-x' />
                                    {inboundTime}
                                </span>
                            </div>
                            <div className='price'>
                                {isPricePPShown ? (
                                    <>
                                        <PriceLabel
                                            price={pricePP}
                                            priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPerson}
                                        />
                                        {' / '}
                                        <PriceLabel
                                            price={price}
                                            priceDictionary={SitecoreDictionary.GlobalsPriceLabelsTotal}
                                        />
                                    </>
                                ) : (
                                    price
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className='table-col' data-tid='airport-name'>
                            <strong>{depAirport}</strong>
                        </div>
                        <div className='table-col' data-tid='other-routes-depart-time'>
                            {outboundTime}
                        </div>
                        <div className='table-col' data-tid='other-routes-return-time'>
                            {inboundTime}
                        </div>
                        {isPricePPShown && (
                            <PriceLabel
                                tag='div'
                                className='table-col price'
                                dataTid='price-per-person'
                                price={pricePP}
                                priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPerson}
                            />
                        )}
                        <div className='table-col price' data-tid='price-total'>
                            {price}
                        </div>
                    </>
                )}

                <div className='table-col small icon'>
                    {isSelected ? (
                        <>
                            <SvgTick />
                            <span className='visually-hidden'>
                                {getPhrase(SitecoreDictionary.AlternativeFlightsButtonsSelected)}
                            </span>
                        </>
                    ) : (
                        <>
                            <IconChevronRight />
                            <span className='visually-hidden'>
                                {getPhrase(SitecoreDictionary.AlternativeFlightsButtonsSelect)}
                            </span>
                        </>
                    )}
                </div>
            </a>
        </Link>
    );
};

export default OtherRoutesItem;
