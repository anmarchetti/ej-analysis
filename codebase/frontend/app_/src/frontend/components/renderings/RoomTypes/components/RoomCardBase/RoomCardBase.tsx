import { FC } from 'react';
import classNames from 'classnames';

import { IUnit } from 'models/data/IOffer';
import styles from 'frontend/components/renderings/RoomTypes/components/Room.module.scss';
import RoomCard from 'frontend/components/renderings/RoomTypes/components/RoomCard/RoomCard';

export interface IRoomCardBaseProps {
    room: IUnit;
    fallbackImg?: string;
    isAlteration?: boolean;
    roomIdx?: number;
}

const RoomCardBase: FC<IRoomCardBaseProps> = ({ room, roomIdx = 0, fallbackImg, isAlteration }) => (
    <RoomCard
        room={room}
        fallbackImage={fallbackImg || ''}
        // default values as we just need to display the room card
        offer={null}
        priceDifference={0}
        selectedRoomSectionIndex={roomIdx}
        isMultipleRoomSelected={false}
        isSelected
        isAlteration={isAlteration}
        tooltipClass={classNames(styles.tooltip, styles.priority)}
    />
);

export default RoomCardBase;
