import React, { FunctionComponent } from 'react';
import classNames from 'classnames';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

export interface IFlightPlusHotelDiscountPriceProps {
    discount: number;
    formattedDiscount: string;
    isFph: boolean;
    priceClassName?: string;
    wrapperClassName?: string;
}

const FlightPlusHotelDiscountPrice: FunctionComponent<IFlightPlusHotelDiscountPriceProps> = ({
    isFph,
    discount,
    wrapperClassName,
    priceClassName,
    formattedDiscount,
}) => {
    if (!isFph || discount <= 0) {
        return null;
    }

    return (
        <div className={classNames(wrapperClassName)} data-tid='flight-plus-hotel-discount'>
            <RichTextDictionary tag='p' dictionaryKey={SitecoreDictionary.FlightPlusHotelPricesDiscount} />
            <div className={classNames(priceClassName)} data-tid='flight-plus-hotel-discount-price'>
                -{formattedDiscount}
            </div>
        </div>
    );
};

export default FlightPlusHotelDiscountPrice;
