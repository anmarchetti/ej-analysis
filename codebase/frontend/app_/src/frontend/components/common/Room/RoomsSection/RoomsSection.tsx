import { FC } from 'react';
import classNames from 'classnames';

import { IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import RoomCard from 'frontend/components/common/Room/RoomCard/RoomCard';
import RoomCardsList, { IRoomCardListMobileMeta } from 'frontend/components/common/Room/RoomCardsList/RoomCardsList';

import styles from './RoomsSection.module.scss';

export interface IRoomsSectionProps {
    hideMoreCollapsedTitle: string;
    onChangeRoom: (room: IUnit) => void;
    rooms: IUnit[];
    showMoreExpandedTitle: string;
    altRoomsTitle?: string;
    chosenRoom?: IUnit;
    containerClass?: string;
    countryCode?: string;
    freeChildPlaceTooltip?: string;
    isLoading?: boolean;
    loadingSkeleton?: JSX.Element;
    mobileListMeta?: IRoomCardListMobileMeta;
    originalRoomTitle?: string;
    pricePostfix?: SitecoreDictionary;
    rendering?: ISitecoreComponent['rendering'];
    showRoomsPart?: number;
}

const RoomsSection: FC<IRoomsSectionProps> = ({
    onChangeRoom,
    rooms,
    hideMoreCollapsedTitle,
    showMoreExpandedTitle,
    pricePostfix,
    showRoomsPart,
    chosenRoom,
    originalRoomTitle,
    altRoomsTitle,
    isLoading,
    mobileListMeta,
    freeChildPlaceTooltip,
    countryCode,
    rendering,
    containerClass,
    loadingSkeleton,
}) => (
    <div className={classNames(styles.container, containerClass)} data-tid='rbc-section'>
        {!!chosenRoom && (
            <div className={styles.originalRoom} aria-label={originalRoomTitle} data-tid='your-room'>
                <p className={styles.title}>{originalRoomTitle}</p>
                <RoomCard
                    room={chosenRoom}
                    pricePostfix={pricePostfix}
                    isSelected
                    isLoading={isLoading}
                    freeChildPlaceTooltip={freeChildPlaceTooltip}
                    countryCode={countryCode}
                    loadingSkeleton={loadingSkeleton}
                />
            </div>
        )}
        {!!rooms.length && (
            <RoomCardsList
                rooms={rooms}
                pricePostfix={pricePostfix}
                hideMoreCollapsedTitle={hideMoreCollapsedTitle}
                showMoreExpandedTitle={showMoreExpandedTitle}
                showRoomsPart={showRoomsPart}
                title={altRoomsTitle}
                onChangeRoom={onChangeRoom}
                isLoading={isLoading}
                mobileListMeta={mobileListMeta}
                freeChildPlaceTooltip={freeChildPlaceTooltip}
                countryCode={countryCode}
                rendering={rendering}
            />
        )}
    </div>
);

export default RoomsSection;
