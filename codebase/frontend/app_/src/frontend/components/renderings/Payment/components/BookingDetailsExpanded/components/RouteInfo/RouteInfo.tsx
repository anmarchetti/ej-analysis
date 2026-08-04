import { FC, Fragment } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IGuestsAmount } from 'frontend/utils/luggage.utils';
import { getFlightNumberWithCarNumber } from 'frontend/utils/route.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IRoute } from 'models/data/IRoute';
import { IPassengerSeat, ISelectedSeatDetails } from 'models/data/ISeatMapStore';
import { DestinationRouteFlag } from 'models/enum/DestinationRouteFlag';
import CabinBagsInfo, { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import SeatsInfo from 'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/SeatsInfo/SeatsInfo';

import styles from './RouteInfo.module.scss';

export interface IRouteInfoProps {
    flag: DestinationRouteFlag;
    route: IRoute;
    cabinBags?: {
        fields: ICabinBagsInfoFields;
        guestsAmountByType: IGuestsAmount;
    };
    isPrintPreview?: boolean;
    seatSelection?: ISelectedSeatDetails[] | IPassengerSeat[];
    seatSummaryText?: string;
}

const RouteInfo: FC<IRouteInfoProps> = ({ route, flag, seatSelection, cabinBags, seatSummaryText, isPrintPreview }) => {
    const { isTradePortal, LCBCount } = useStore((stores: TStores) => ({
        isTradePortal: stores.layoutStore.isTradePortal,
        LCBCount: stores.bookingStore.extraLuggage.LCBCount,
    }));

    const depDate = formatDateL10n(route.depDate, DATE_FORMATS.fullDate);
    const arrDate = formatDateL10n(route.arrDate, DATE_FORMATS.fullDate);
    const depTime = formatDateL10n(route.depDate, DATE_FORMATS.time);
    const arrTime = formatDateL10n(route.arrDate, DATE_FORMATS.time);
    const flightNumber = getFlightNumberWithCarNumber(route);

    const dateString =
        depDate === arrDate ? `${depDate} ${depTime} - ${arrTime}` : `${depDate} ${depTime} - ${arrDate} ${arrTime}`;

    const seatSummaryLabel = Tokenizer.replaceTokens(seatSummaryText, {
        [Tokens.Number]: seatSelection?.length.toString() || '',
    });

    const dateSectionComponent = (
        <div className={classNames({ [styles.quoteHead]: isPrintPreview })} data-tid='flight-time'>
            {dateString}
        </div>
    );

    const flightNumberComponent =
        (isTradePortal && !!flightNumber && <div data-tid='flight-number'>{flightNumber}</div>) || null;
    const showSeatInfo = !isPrintPreview || !seatSelection;
    const showSeatSummary = isPrintPreview && seatSelection && seatSummaryLabel.length;

    return (
        <>
            <div
                className={classNames({ [styles.head]: !isPrintPreview, [styles.quoteHead]: isPrintPreview })}
                data-tid='route-container'
            >
                {route.depName} - {route.arrName}
            </div>
            {isPrintPreview ? (
                <Fragment>
                    {flightNumberComponent}
                    {dateSectionComponent}
                </Fragment>
            ) : (
                <Fragment>
                    {dateSectionComponent}
                    {flightNumberComponent}
                </Fragment>
            )}
            {showSeatInfo && (
                <div data-tid='seats-info'>
                    {/* strict typing is added to be able to use this component in pdf with another type of seatSelection.
                        see BookingDetailsQuote component for more details */}
                    <SeatsInfo seats={seatSelection as ISelectedSeatDetails[]} flag={flag} />
                </div>
            )}
            {showSeatSummary && <div data-tid='seat-summary'>{seatSummaryLabel}</div>}
            {cabinBags && (
                <CabinBagsInfo
                    fields={cabinBags.fields}
                    guestsAmountByType={cabinBags.guestsAmountByType}
                    LCBCount={LCBCount}
                    containerClassName={styles.cabinBagsWrapper}
                    bagTypeClassName={styles.bagType}
                    iconClassName={styles.icon}
                />
            )}
        </>
    );
};

export default observer(RouteInfo);
