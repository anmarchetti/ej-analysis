import { FunctionComponent } from 'react';
import classNames from 'classnames';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { IBookingPackage } from 'models/data/IBookingInfo';
import SvgHotelLined from 'frontend/components/icons-new/HotelLined';

import styles from './HotelDetails.module.scss';

interface IHotelDetailsProps {
    location: IBookingPackage['location'];
    className?: string;
    dataTid?: string;
    name?: string;
}

const HotelDetails: FunctionComponent<IHotelDetailsProps> = ({
    className,
    dataTid = 'hotel-details',
    name,
    location,
}) => {
    const isMobile = useMobileViewport();

    const { city, region } = location;

    return (
        <div className={classNames(className, styles.container)} data-tid={dataTid}>
            <SvgHotelLined data-tid={`${dataTid}-icon`} />
            {isMobile ? (
                <div className={styles.column}>
                    <div className={styles.title} data-tid={`${dataTid}-title`}>
                        {name}
                    </div>
                    <span data-tid={`${dataTid}-location`}>{`${city}, ${region}`}</span>
                </div>
            ) : (
                <span data-tid={`${dataTid}-location`}>
                    <strong>{name}</strong>, {city}
                </span>
            )}
        </div>
    );
};

export default HotelDetails;
