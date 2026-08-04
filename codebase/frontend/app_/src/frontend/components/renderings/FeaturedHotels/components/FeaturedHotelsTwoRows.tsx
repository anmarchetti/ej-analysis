import React, { FC } from 'react';
import classNames from 'classnames';

import { IFeaturedHotelsWithPrice } from 'models/data/IFeaturedHotel';

import FeaturedHotelCard from './FeaturedHotelCard';

interface IFeaturedHotelsTwoRowsProps {
    fallbackImage: string;
    hotels: IFeaturedHotelsWithPrice[];
    onClick: (index: number, item: IFeaturedHotelsWithPrice, destination: string) => void;
    displayNumberOfNights?: boolean;
}

const MAX_ITEMS_PER_ROW = 2;
const MAX_ITEMS = 4;

export const FeaturedHotelsTwoRows: FC<IFeaturedHotelsTwoRowsProps> = props => {
    const firstRow = () => props.hotels.slice(0, props.hotels.length < MAX_ITEMS ? 1 : MAX_ITEMS_PER_ROW); // show 1 card in row if number of hotels less then 4
    const secondRow = () => {
        const firstRowHotels = firstRow();

        return props.hotels.filter(el => firstRowHotels.indexOf(el) < 0);
    };

    const classRowName = items =>
        classNames('featured-hotels__row', items.length === MAX_ITEMS_PER_ROW && 'featured-hotels__row--two-hotels');

    const firstRowHotels = firstRow();
    const secondRowHotels = secondRow();

    return (
        <div className='featured-hotels__rows' key={`'featured-hotels__rows_${props.hotels[0].Name}`}>
            <div
                className={classRowName(firstRowHotels)}
                data-tid={classRowName(firstRowHotels)}
                key='featured-hotels__row-one'
            >
                {firstRowHotels.map((item: IFeaturedHotelsWithPrice, i: number) => (
                    <FeaturedHotelCard
                        fallbackImage={props.fallbackImage}
                        hotel={item}
                        key={`first-row_${i}`}
                        onClick={(item, destination) => props.onClick(i, item, destination)}
                        displayNumberOfNights={props.displayNumberOfNights}
                    />
                ))}
            </div>
            <div
                className={classRowName(secondRowHotels)}
                data-tid={classRowName(secondRowHotels)}
                key='featured-hotels__row-two'
            >
                {secondRowHotels.map((item: IFeaturedHotelsWithPrice, i: number) => (
                    <FeaturedHotelCard
                        fallbackImage={props.fallbackImage}
                        hotel={item}
                        key={`second-row_${i}`}
                        onClick={(item, destination) => props.onClick(firstRowHotels.length + i, item, destination)}
                        displayNumberOfNights={props.displayNumberOfNights}
                    />
                ))}
            </div>
        </div>
    );
};

export default FeaturedHotelsTwoRows;
