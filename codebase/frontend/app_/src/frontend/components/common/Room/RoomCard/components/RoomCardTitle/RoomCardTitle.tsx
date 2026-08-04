import { FunctionComponent } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getRoomName } from 'frontend/utils/offer.utils';
import { roomTitleNormalize } from 'frontend/utils/string.utils';
import { IUnit } from 'models/data/IOffer';
import { MarketCode } from 'models/data/MarketSettings';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FreeForKidsPill from 'frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill';
import UrgencyMessage from 'frontend/components/common/UrgencyMessage/UrgencyMessage';
import { useUrgencyMessageText } from 'frontend/components/common/UrgencyMessage/UrgencyMessage.hooks';

import styles from './RoomCardTitle.module.scss';

export interface IRoomCardTitleProps {
    room: IUnit;
    countryCode?: string;
    freeChildPlaceTooltip?: string;
    withIncludedSubtitle?: boolean;
}

const RoomCardTitle: FunctionComponent<IRoomCardTitleProps> = ({
    withIncludedSubtitle,
    room,
    freeChildPlaceTooltip,
    countryCode,
}) => {
    const { getPhrase, marketCode } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        marketCode: stores.marketStore.marketCode,
    }));

    const { urgencyMessageText, urgencyMessageTooltipText } = useUrgencyMessageText({ avail: room.avail ?? 0 });

    const roomName = getRoomName(room.roomType);
    const titleText = roomTitleNormalize(roomName || '');
    const subtitle = getPhrase(SitecoreDictionary.RoomTypesLabelsIncludedInRoom);
    const isUKMarket = marketCode === MarketCode.UK;
    const isShowFreeForKidsPill = room.isFreeForKids && !!freeChildPlaceTooltip && !!countryCode;

    return (
        <div className={styles.container} data-tid='room-card-header'>
            <div className={styles.titleContainer}>
                <p aria-label={titleText} className={styles.title} data-tid='room-title'>
                    {titleText}
                </p>
                <div className={styles.pills} data-tid='room-card-pills'>
                    {isUKMarket && (
                        <UrgencyMessage
                            className={styles.urgency}
                            message={urgencyMessageText}
                            tooltip={urgencyMessageTooltipText}
                        />
                    )}
                    {isShowFreeForKidsPill && (
                        <FreeForKidsPill tooltipMessage={freeChildPlaceTooltip} countryCode={countryCode} />
                    )}
                </div>
            </div>
            {withIncludedSubtitle && (
                <p className={styles.subtitle} aria-label={subtitle} data-tid='room-subtitle'>
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default RoomCardTitle;
