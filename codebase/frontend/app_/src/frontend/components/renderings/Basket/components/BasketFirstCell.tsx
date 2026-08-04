import React, { useMemo } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IBoardType, IRoomType } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BasketDiagonalCellABStyles from 'frontend/components/cro/BasketAB/components/BasketDiagonalCellsAB.module.scss';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import SVGLocationPinFilled from 'frontend/components/icons-new/LocationPinFilled';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';

interface IBasketFirstCellProps {
    board: Nullable<IBoardType>;
    className: string;
    offer: IOfferWithoutAltBoards;
    room: Nullable<IRoomType>;
    isABTestingComponent?: boolean;
}

export const BasketFirstCell = ({
    offer,
    className,
    board,
    room,
    isABTestingComponent = false,
}: IBasketFirstCellProps) => {
    const { whoValue, totalGuestsQuantity, getPhrase } = useStore((stores: TStores) => ({
        whoValue: stores.bookingStore.whoValueOnlyGuests,
        totalGuestsQuantity: stores.bookingStore.totalGuestsQuantity,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const totalGuestsQuantityLabel = useMemo(
        () =>
            getPhrase(
                totalGuestsQuantity > 1
                    ? SitecoreDictionary.GlobalsLabelsGuests
                    : SitecoreDictionary.GlobalsLabelsGuest,
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [totalGuestsQuantity],
    );

    const countRoomWithLabel = useMemo(() => {
        const roomsCount = offer?.accom?.unit?.length;

        if (!roomsCount) {
            return null;
        }

        return roomsCount > 1
            ? `${roomsCount} ${getPhrase(SitecoreDictionary.GlobalsLabelsRooms)}`
            : `${roomsCount} ${getPhrase(SitecoreDictionary.GlobalsLabelsRoom)}`;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offer]);

    const guests = isABTestingComponent ? `${totalGuestsQuantity} ${totalGuestsQuantityLabel}` : whoValue;

    return (
        <div
            className={classNames(
                `${className}-cell`,
                isABTestingComponent && `reverse ${BasketDiagonalCellABStyles.firstCell}`,
            )}
        >
            <ul className='list list--icon'>
                {!isABTestingComponent && offer?.hotel && (
                    <li className='list-item--icon' data-tid='hotel-location'>
                        <i className='basket-icon'>
                            <SVGLocationPinFilled />
                        </i>

                        <div>
                            <span className='text-bold text-bold--destination'>
                                {offer?.hotel?.resort?.name || ''},
                            </span>{' '}
                            {offer?.hotel?.name || ''}
                        </div>
                    </li>
                )}

                {board && (
                    <li className='list-item--icon' data-tid='board-type' data-board={board.code}>
                        <i className='basket-icon'>
                            <BoardTypeIcon iconUrl={board.iconUrl} />
                        </i>
                        <span>{board.title}</span>
                    </li>
                )}

                {room && (
                    <li className='list-item--icon' data-tid='room-type' data-room={room.code}>
                        <i className='basket-icon'>
                            <SVGHotelBedFilled />
                        </i>
                        <span>{`${guests}, ${countRoomWithLabel}`}</span>
                    </li>
                )}
            </ul>
        </div>
    );
};

export default BasketFirstCell;
