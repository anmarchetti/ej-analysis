import { FC } from 'react';

import { IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RoomCardAction from 'frontend/components/common/Room/RoomCard/components/RoomCardAction/RoomCardAction';
import RoomCardTitle from 'frontend/components/common/Room/RoomCard/components/RoomCardTitle/RoomCardTitle';
import RoomFacilities from 'frontend/components/renderings/RoomTypes/components/RoomFacilities/RoomFacilities';

import styles from './RoomCardContent.module.scss';

export interface IRoomCardContentProps {
    room: IUnit;
    countryCode?: string;
    freeChildPlaceTooltip?: string;
    isSelected?: boolean;
    onClick?: () => void;
    pricePostfix?: SitecoreDictionary;
}

const RoomCardContent: FC<IRoomCardContentProps> = ({
    room,
    isSelected,
    pricePostfix,
    onClick,
    freeChildPlaceTooltip,
    countryCode,
}) => {
    const { roomType } = room;

    return (
        <div className={styles.container}>
            <RoomCardTitle
                withIncludedSubtitle={isSelected}
                room={room}
                freeChildPlaceTooltip={freeChildPlaceTooltip}
                countryCode={countryCode}
            />
            <div className={styles.mainContent}>
                <div className={styles.facilities}>
                    <RoomFacilities
                        facilities={roomType.facilities}
                        roomFacilityFolderId={roomType.roomFacilityFolderId}
                    />
                </div>
                <RoomCardAction
                    price={room.price}
                    isPriceVisible
                    isSelected={isSelected}
                    pricePostfix={pricePostfix}
                    className={styles.action}
                    onClick={onClick}
                />
            </div>
        </div>
    );
};

export default RoomCardContent;
