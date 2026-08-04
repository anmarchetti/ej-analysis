import { FunctionComponent } from 'react';
import qs from 'qs';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { buildHotelDetailsUrl } from 'frontend/utils/getHotelLocation';
import { IHotel } from 'models/data/IHotel';
import { QueryParamName } from 'models/enum/QueryParamName';
import Link from 'frontend/components/common/Link';

export interface IHotelPreviewLinkProps {
    children: React.ReactNode;
    hotel: IHotel;
    className?: string;
    clickHandler?: (hotelPreviewLink: string) => void;
}

const HotelPreviewLink: FunctionComponent<IHotelPreviewLinkProps> = ({ hotel, className, children, clickHandler }) => {
    const isMobile = useMobileViewport();
    const hotelPreviewLink = buildHotelDetailsUrl(hotel) + `?${qs.stringify({ [QueryParamName.HotelPreview]: 1 })}`;

    return (
        <Link href={hotelPreviewLink} legacyBehavior>
            <a
                className={className}
                target={isMobile ? undefined : '_blank'}
                data-tid='view-hotel-details'
                rel='noreferrer'
                {...(clickHandler && { onClick: () => clickHandler(hotelPreviewLink) })}
            >
                {children}
            </a>
        </Link>
    );
};

export default HotelPreviewLink;
