import { FC, Fragment } from 'react';

import { IHotelLocationLink } from 'frontend/components/renderings/HotelDetails/components/HotelLocation';

interface IHotelLocationLabelsProps {
    locationLinks: IHotelLocationLink[];
}

export const HotelLocationLabels: FC<IHotelLocationLabelsProps> = ({ locationLinks }) => (
    <Fragment>
        {!!locationLinks.length &&
            locationLinks.map((item, index) => (
                <span key={index}>{item.value.text + (index !== locationLinks.length - 1 ? ', ' : '')}</span>
            ))}
    </Fragment>
);
