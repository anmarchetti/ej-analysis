import { FunctionComponent, useRef } from 'react';
import classnames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import OfferCardSlider from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import RoomSkeleton from 'frontend/components/common/Room/RoomSkeleton/RoomSkeleton';

import RoomCardContent from './components/RoomCardContent/RoomCardContent';

import styles from './RoomCard.module.scss';

export interface IRoomCardProps {
    room: IUnit;
    countryCode?: string;
    fallbackImage?: string;
    freeChildPlaceTooltip?: string;
    isLoading?: boolean;
    isSelected?: boolean;
    loadingSkeleton?: JSX.Element;
    onChange?: (room: IUnit) => void;
    pricePostfix?: SitecoreDictionary;
}

const RoomCard: FunctionComponent<IRoomCardProps> = ({
    fallbackImage,
    room,
    pricePostfix,
    isSelected,
    onChange,
    isLoading,
    freeChildPlaceTooltip,
    countryCode,
    loadingSkeleton,
}) => {
    const roomRef = useRef<HTMLDivElement>(null);

    const { getSetting } = useStore((stores: TStores) => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const handleChange = () => {
        onChange?.(room);
    };

    if (isLoading) {
        return loadingSkeleton || <RoomSkeleton height={roomRef.current?.offsetHeight} />;
    }

    const { roomType } = room;

    return (
        <div
            className={classnames(styles.container, {
                [styles.isSelected]: isSelected,
                [styles.isLoading]: isLoading,
            })}
            ref={roomRef}
            data-tid='room-card'
        >
            <OfferCardSlider
                fallbackImage={fallbackImage ?? getSetting(SiteSettings.HotelFallbackImage)}
                images={roomType.images}
                showIndex
                isFullScreenEnabled
                className={styles.carousel}
            />
            <RoomCardContent
                room={room}
                pricePostfix={pricePostfix}
                isSelected={isSelected}
                onClick={handleChange}
                freeChildPlaceTooltip={freeChildPlaceTooltip}
                countryCode={countryCode}
            />
        </div>
    );
};

export default RoomCard;
