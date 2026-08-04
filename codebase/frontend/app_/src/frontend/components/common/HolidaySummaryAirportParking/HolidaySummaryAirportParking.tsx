import { FC } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import SvgParking from 'frontend/components/icons-new/Parking';

import styles from './HolidaySummaryAirportParking.module.scss';

export interface IHolidaySummaryAirportParkingProps {
    airportParking: IAirportParking;
    dataTid: string;
    airportParkingInfoFields?: IAirportParkingInfoFields;
    departureAirportName?: string;
}

export interface IAirportParkingInfoFields {
    AirportParkingInstructions: ISitecoreField<string>;
    AirportParkingTitle: ISitecoreField<string>;
}

const TIME_LENGTH = 5;

const HolidaySummaryAirportParking: FC<IHolidaySummaryAirportParkingProps> = ({
    airportParking,
    airportParkingInfoFields,
    departureAirportName,
    dataTid,
}) => {
    const {
        title: parkingName,
        bookingDetails: { startDate, startTime, endDate, endTime },
    } = airportParking;

    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const dateFormat = 'ddd Do MMM YYYY';

    const formattedStartDate = formatDateL10n(startDate, dateFormat);
    const formattedEndDate = formatDateL10n(endDate, dateFormat);

    const formattedPeriodOfTime: string = `${formattedStartDate} ${startTime?.substring(
        0,
        TIME_LENGTH,
    )} - ${formattedEndDate} ${endTime?.substring(0, TIME_LENGTH)}`;

    const parkingTitle = departureAirportName
        ? Tokenizer.replaceToken(
              airportParkingInfoFields?.AirportParkingTitle.value,
              Tokens.Airport,
              departureAirportName,
          )
        : getPhrase(SitecoreDictionary.GlobalsLabelsAirportParking);

    return (
        <div className={styles.container} data-tid={dataTid}>
            <div className={styles.block}>
                <SvgParking className={styles.icon} data-tid={`${dataTid}-parking-icon`} />
                <div className={styles.content}>
                    <div className={styles.title} data-tid={`${dataTid}-parking-title`}>
                        {parkingTitle}
                    </div>
                    <div data-tid={`${dataTid}-parking-name`}>{parkingName}</div>
                    <div data-tid={`${dataTid}-parking-dates`}>{formattedPeriodOfTime}</div>
                    <div data-tid={`${dataTid}-parking-instructions`}>
                        {airportParkingInfoFields?.AirportParkingInstructions.value}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolidaySummaryAirportParking;
