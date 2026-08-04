import React, { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { IOffer } from 'models/data/IOffer';
import Button from 'frontend/components/common/Button';
import Link from 'frontend/components/common/Link';

export interface IOfferCardHotelTitleProps {
    hotelLink: string;
    offer: IOffer;
    onClick: () => void;
    hotelLinkWithPrice?: string;
}

const OfferCardHotelTitle: FC<IOfferCardHotelTitleProps> = ({ onClick, offer, hotelLink, hotelLinkWithPrice }) => {
    const { isShortlistPage, isOfferFromAnotherMarket } = useStore((stores: TStores) => ({
        isShortlistPage: stores.layoutStore.isShortlistPage,
        isOfferFromAnotherMarket: isHolidayStore(stores)
            ? stores.shortlistStore.isOfferFromAnotherMarket
            : (): boolean => false,
    }));

    const hotelName = offer.hotel?.name;
    const className = 'hotel-card-head-title hotel-card-head-title-v2';

    // on shortlist, we have popup to change market
    if (isShortlistPage && isOfferFromAnotherMarket(offer)) {
        return (
            <Button onClick={onClick} isText className={className}>
                {hotelName}
            </Button>
        );
    }

    return (
        <Link href={hotelLinkWithPrice || hotelLink} onClick={onClick} className={className} as={hotelLink}>
            {hotelName}
        </Link>
    );
};

export default OfferCardHotelTitle;
