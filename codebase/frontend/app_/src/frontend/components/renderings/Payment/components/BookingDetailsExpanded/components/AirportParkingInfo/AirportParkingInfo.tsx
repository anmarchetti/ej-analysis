import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { formatDateL10n, getTimeWithoutSeconds } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import { ITransport } from 'models/data/IOffer';
import { RouteDirection } from 'models/enum/RouteDirection';
import SvgParking from 'frontend/components/icons-new/Parking';
import { IAirportParkingFields } from 'frontend/components/renderings/Payment/interfaces';

import styles from './AirportParkingInfo.module.scss';

interface IAirportParkingInfoProps {
    airportParkingDetails: IAirportParking;
    fields: IAirportParkingFields;
    transport: Nullable<ITransport>;
}

const AirportParkingInfo: FC<IAirportParkingInfoProps> = ({ airportParkingDetails, transport, fields }) => {
    const {
        title: parkingName,
        bookingDetails: { startDate, startTime, endDate, endTime },
    } = airportParkingDetails;

    const { EmailInstruction, DepartureAirportText, ParkingDates } = fields;

    const formattedStartDate: string = formatDateL10n(startDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr);
    const formattedEndDate: string = formatDateL10n(endDate, DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr);
    const formattedDatesTime = Tokenizer.replaceTokens(ParkingDates?.value, {
        [Tokens.From]: `${formattedStartDate} ${getTimeWithoutSeconds(startTime)}`,
        [Tokens.To]: `${formattedEndDate} ${getTimeWithoutSeconds(endTime)}`,
    });

    const outboundFlight = transport?.routes.find(el => el.direction === RouteDirection.Outbound);

    const formattedAirportTitle = Tokenizer.replaceTokens(DepartureAirportText?.value, {
        [Tokens.Destination]: outboundFlight?.depName ?? Tokens.Destination,
    });

    return (
        <div data-tid='airport-parking-info' className={styles.row}>
            <div className={styles.blockItem}>
                <SvgParking className={styles.svgIcon} />
                <div data-tid='airport-name' className={styles.airportTitle}>
                    {formattedAirportTitle}
                </div>
                <div data-tid='parking-name'>{parkingName}</div>
                {ParkingDates?.value && <div data-tid='parking-date-time'>{formattedDatesTime}</div>}
                {EmailInstruction?.value && <Text data-tid='email-instruction' tag='span' field={EmailInstruction} />}
            </div>
        </div>
    );
};
export default observer(AirportParkingInfo);
