import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getSingleRoute } from 'frontend/utils/route.utils';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { RouteDirection } from 'models/enum/RouteDirection';
import SVGCalendarLined from 'frontend/components/icons-new/CalendarLined';
import SVGDepartureFilled from 'frontend/components/icons-new/DepartureFilled';

import styles from './BasketVerticalCellsAB.module.scss';

export interface IBasketSecondCellABProps {
    className: string;
    offer: IOfferWithoutAltBoards;
}

export const BasketSecondCellAB: FC<IBasketSecondCellABProps> = ({ offer, className }) => {
    const { getPhrase, isScreenExtraSmall } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
    }));
    const outbound: Nullable<IRoute> = getSingleRoute(
        offer.transport.routes.filter(el => el.direction === RouteDirection.Outbound),
    );
    const inbound: Nullable<IRoute> = getSingleRoute(
        offer.transport.routes.filter(el => el.direction === RouteDirection.Inbound),
    );
    const outboundDepartureDate: string = outbound ? formatDateL10n(outbound.depDate, DATE_FORMATS.fullDateTime) : '';
    const inboundDepartureDate: string = inbound ? formatDateL10n(inbound.depDate, DATE_FORMATS.fullDateTime) : '';

    return (
        <div className={`${className}-cell`} data-tid='second-cell'>
            <ul className='list list--icon'>
                <li className='list-item--icon' data-tid='stay-duration'>
                    <i className='basket-icon'>
                        <SVGCalendarLined />
                    </i>
                    <span>{getDurationLabel(getPhrase, offer.stay)}</span>
                </li>
                <li className='list-item--icon' data-route={outbound?.id}>
                    <i className='basket-icon'>
                        <SVGDepartureFilled />
                    </i>
                    <span className={classNames(styles.iconBoldText, 'basket__airport')} data-tid='departure-airport'>
                        {outbound && (isScreenExtraSmall ? outbound.depName : outbound.depPt)}
                    </span>
                    &nbsp;
                    <span data-tid='departure-date'>{outboundDepartureDate}</span>
                </li>
                <li className='list-item--icon' data-route={inbound?.id}>
                    <i className='basket-icon'>
                        <SVGDepartureFilled className='icon--reflect-x' />
                    </i>
                    <span className={classNames(styles.iconBoldText, 'basket__airport')} data-tid='arrival-airport'>
                        {inbound && (isScreenExtraSmall ? inbound.depName : inbound.depPt)}
                    </span>
                    &nbsp;
                    <span data-tid='arrival-date'>{inboundDepartureDate}</span>
                </li>
            </ul>
        </div>
    );
};

export default observer(BasketSecondCellAB);
