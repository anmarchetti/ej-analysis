import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import RoomCardListDesktop from './component/RoomCardListDesktop/RoomCardListDesktop';
import RoomCardListMobile from './component/RoomCardListMobile/RoomCardListMobile';

import styles from './RoomCardsList.module.scss';

export interface IRoomCardListMobileMeta {
    description?: string;
    showMoreLabel?: string;
    title?: string;
}
export interface IRoomCardsListProps {
    hideMoreCollapsedTitle: string;
    onChangeRoom: (room: IUnit) => void;
    rooms: IUnit[];
    showMoreExpandedTitle: string;
    countryCode?: string;
    freeChildPlaceTooltip?: string;
    isLoading?: boolean;
    mobileListMeta?: IRoomCardListMobileMeta;
    pricePostfix?: SitecoreDictionary;
    rendering?: ISitecoreComponent['rendering'];
    showRoomsPart?: number;
    title?: string;
}

const RoomCardsList = ({
    rooms,
    pricePostfix,
    hideMoreCollapsedTitle,
    showMoreExpandedTitle,
    mobileListMeta = {},
    showRoomsPart,
    title,
    onChangeRoom,
    isLoading,
    freeChildPlaceTooltip,
    countryCode,
    rendering,
}: IRoomCardsListProps) => {
    const { isScreenLessMedium } = useStore((stores: TStores) => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
    }));

    return (
        <div className={styles.container} aria-label={title}>
            <p className={styles.title} data-tid='room-list-title'>
                {title}
            </p>
            <div>
                {!isScreenLessMedium && (
                    <RoomCardListDesktop
                        rooms={rooms}
                        pricePostfix={pricePostfix}
                        hideMoreCollapsedTitle={hideMoreCollapsedTitle}
                        showMoreExpandedTitle={showMoreExpandedTitle}
                        showRoomsPart={showRoomsPart}
                        onChangeRoom={onChangeRoom}
                        isLoading={isLoading}
                        freeChildPlaceTooltip={freeChildPlaceTooltip}
                        countryCode={countryCode}
                    />
                )}
            </div>
            {isScreenLessMedium && (
                <RoomCardListMobile
                    rooms={rooms}
                    pricePostfix={pricePostfix}
                    showRoomsPart={showRoomsPart}
                    onChangeRoom={onChangeRoom}
                    isLoading={isLoading}
                    freeChildPlaceTooltip={freeChildPlaceTooltip}
                    countryCode={countryCode}
                    rendering={rendering}
                    showMoreLabel={showMoreExpandedTitle}
                    {...mobileListMeta}
                />
            )}
        </div>
    );
};

export default observer(RoomCardsList);
