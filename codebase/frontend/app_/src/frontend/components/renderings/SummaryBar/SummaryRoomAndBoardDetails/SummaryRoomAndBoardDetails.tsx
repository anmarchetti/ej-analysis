import { FunctionComponent } from 'react';
import classNames from 'classnames';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import SvgKey from 'frontend/components/icons-new/Key';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';
import summaryDetailsStyles from 'frontend/components/renderings/SummaryBar/SummaryDetails/SummaryDetails.module.scss';
import SummaryEditButton from 'frontend/components/renderings/SummaryBar/SummaryEditButton/SummaryEditButton';
import roomAndBoardStyles from 'frontend/components/renderings/SummaryBar/SummaryRoomAndBoardDetails/SummaryRoomAndBoardDetails.module.scss';

interface IBoardItem {
    code: string;
    name: string;
}

interface IRoomItem {
    code: string;
    name: string;
    quantity: number;
}

interface ISummaryRoomAndBoardDetailsProps extends ISummaryBarSitecoreFields {
    onEditClick?: () => void;
}

const renderRoomItem = (roomItem: IRoomItem): JSX.Element => (
    <p key={roomItem.code}>
        {roomItem.quantity} x {roomItem.name}
    </p>
);

const renderBoardItem = (boardItem: IBoardItem): JSX.Element => (
    <div className={roomAndBoardStyles.extra}>
        <p>{boardItem.name}</p>
    </div>
);

const getRoomItems = (offer: IOfferWithoutAltBoards): IRoomItem[] => {
    const roomMap: Record<string, IRoomItem> = {};

    for (const unit of offer.accom.unit) {
        const code = unit.roomType.code;
        const name = typeof unit.roomType.title === 'string' ? unit.roomType.title : unit.roomType.title.value;

        if (roomMap[code]) {
            roomMap[code].quantity += 1;
        } else {
            roomMap[code] = { name: name, quantity: 1, code: unit.roomType.code };
        }
    }

    return Object.values(roomMap);
};

const getBoardItem = (offer: IOfferWithoutAltBoards): IBoardItem | null => {
    if (offer.accom.unit.length === 0) return null;

    const unit = offer.accom.unit[0];

    return {
        name: unit.boardType.title,
        code: unit.boardType.code,
    };
};

export const SummaryRoomAndBoardDetails: FunctionComponent<ISummaryRoomAndBoardDetailsProps> = ({
    RoomAndBoardSectionTitle,
    EnableEditButtons,
    onEditClick,
}) => {
    const { offer, alternativeRooms, alternativeBoards } = useStore((stores: TStores) => ({
        offer: stores.bookingStore.selectedOffer,
        alternativeRooms: stores.bookingStore.alternativeRooms,
        alternativeBoards: stores.bookingStore.alternativeBoards,
    }));

    if (!offer) return null;

    const rooms = getRoomItems(offer);
    const board = getBoardItem(offer);
    const hasRoomOrBoardAlternatives =
        toJS(alternativeRooms).flat().length > alternativeRooms.length || alternativeBoards.length;
    const isEditButtonHidden = !EnableEditButtons?.value || !hasRoomOrBoardAlternatives;

    return (
        <div
            className={classNames(summaryDetailsStyles.category, roomAndBoardStyles.categoryRoomAndBoard)}
            data-tid='summary-room-and-board-details'
        >
            <div className={summaryDetailsStyles.titleWrapper}>
                <div className={roomAndBoardStyles.title}>
                    <SvgKey />
                    <h3 data-tid={'summary-room-and-board-title'}>{RoomAndBoardSectionTitle.value}</h3>
                </div>
                <SummaryEditButton
                    dataTid='room-and-board-edit'
                    scrollAnchorId={ScrollAnchorId.BoardTypes}
                    onClick={onEditClick}
                    isHidden={isEditButtonHidden}
                />
            </div>
            <div className={roomAndBoardStyles.itemsContainer}>
                <div className={roomAndBoardStyles.item} data-tid='summary-room-and-board-rooms'>
                    {rooms?.map(room => renderRoomItem(room))}
                </div>
                <div className={roomAndBoardStyles.item} data-tid='summary-room-and-board-board'>
                    {board && renderBoardItem(board)}
                </div>
            </div>
        </div>
    );
};

export default observer(SummaryRoomAndBoardDetails);
