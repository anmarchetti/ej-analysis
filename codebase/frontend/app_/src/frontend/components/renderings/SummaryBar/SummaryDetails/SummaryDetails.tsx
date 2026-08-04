import React, { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';
import SummaryFlightDetails from 'frontend/components/renderings/SummaryBar/SummaryFlightDetails/SummaryFlightDetails';
import SummaryHotelDetails from 'frontend/components/renderings/SummaryBar/SummaryHotelDetails/SummaryHotelDetails';
import SummaryHotelImagesCarousel from 'frontend/components/renderings/SummaryBar/SummaryHotelImagesCarousel/SummaryHotelImagesCarousel';
import SummaryPriceDetails from 'frontend/components/renderings/SummaryBar/SummaryPriceDetails/SummaryPriceDetails';
import SummaryRoomAndBoardDetails from 'frontend/components/renderings/SummaryBar/SummaryRoomAndBoardDetails/SummaryRoomAndBoardDetails';
import SummaryTransferAndParkingDetails from 'frontend/components/renderings/SummaryBar/SummaryTransferAndParkingDetails/SummaryTransferAndParkingDetails';

import styles from './SummaryDetails.module.scss';

export interface ISummaryDetailsProps extends ISummaryBarSitecoreFields {
    onEditClick?: () => void;
}

const SummaryDetails: FunctionComponent<ISummaryDetailsProps> = ({ onEditClick, ...fields }) => {
    if (!fields) return null;

    return (
        <>
            <SummaryHotelImagesCarousel />
            <div className={styles.container}>
                <SummaryHotelDetails {...fields} />
                <SummaryFlightDetails {...fields} onEditClick={onEditClick} />
                <SummaryRoomAndBoardDetails {...fields} onEditClick={onEditClick} />
                <SummaryTransferAndParkingDetails {...fields} onEditClick={onEditClick} />
                <SummaryPriceDetails {...fields} />
            </div>
        </>
    );
};

export default observer(SummaryDetails);
