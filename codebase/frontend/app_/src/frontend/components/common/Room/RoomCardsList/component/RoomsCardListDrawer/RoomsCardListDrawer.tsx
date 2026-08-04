import { useEffect } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classnames from 'classnames';

import { usePagination } from 'frontend/hooks/usePagination/usePagination';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IUnit } from 'models/data/IOffer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import RoomCard from 'frontend/components/common/Room/RoomCard/RoomCard';
import ShowMoreAction from 'frontend/components/common/Room/RoomCardsList/component/RoomCardListMobile/components/ShowMoreAction/ShowMoreAction';

import styles from './RoomsCardListDrawer.module.scss';

export interface IRoomsCardListDrawerProps {
    onChangeRoom: (room: IUnit) => void;
    onCollapse: () => void;
    rooms: IUnit[];
    countryCode?: string;
    description?: string;
    freeChildPlaceTooltip?: string;
    isLoading?: boolean;
    isOpen?: boolean;
    pricePostfix?: SitecoreDictionary;
    rendering?: ISitecoreComponent['rendering'];
    showMoreLabel?: string;
    showRoomsPart?: number;
    title?: string;
}

const RoomsCardListDrawer = ({
    rooms,
    pricePostfix,
    isOpen,
    onCollapse,
    showRoomsPart,
    showMoreLabel,
    onChangeRoom,
    isLoading,
    title,
    description,
    countryCode,
    freeChildPlaceTooltip,
    rendering,
}: IRoomsCardListDrawerProps) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const { itemsToShow, goToNext, isLastPage, page, goToPage } = usePagination<IUnit>(rooms, {
        defaultPage: 1,
        numberToShow: showRoomsPart,
        continuous: true,
    });

    useEffect(() => {
        if (!isOpen && page !== 0) {
            goToPage(1);
        }
    }, [isOpen]);

    const shouldShowHeader = !!title || !!description;

    return (
        <Drawer
            open={isOpen}
            className={classnames('drawer--animation-bottom', styles.drawer)}
            dataTid='drawer-room-select'
        >
            <div className={styles.body}>
                {shouldShowHeader && (
                    <div className={styles.header}>
                        {!!title && <h3 className={styles.title}>{title}</h3>}
                        {!!description && <p className={styles.description}>{description}</p>}
                    </div>
                )}

                <Placeholder name={PlaceholderNames.ChangeFeeInfo} rendering={rendering} />

                <div className={styles.list}>
                    {itemsToShow.map(room => (
                        <RoomCard
                            key={`${room.code}-${room.board}`}
                            room={room}
                            pricePostfix={pricePostfix}
                            onChange={onChangeRoom}
                            isLoading={isLoading}
                            countryCode={countryCode}
                            freeChildPlaceTooltip={freeChildPlaceTooltip}
                        />
                    ))}
                </div>
                {!isLastPage && <ShowMoreAction label={showMoreLabel} onClick={goToNext} />}
            </div>
            <Button
                className={classnames('drawer__actions', styles.cancelBtn)}
                isText
                isFullWidth
                disabled={false}
                dataTid='cancel-btn'
                onClick={onCollapse}
                aria-label={getPhrase(SitecoreDictionary.RoomTypesButtonsCancel)}
            >
                {getPhrase(SitecoreDictionary.RoomTypesButtonsCancel)}
            </Button>
        </Drawer>
    );
};

export default RoomsCardListDrawer;
