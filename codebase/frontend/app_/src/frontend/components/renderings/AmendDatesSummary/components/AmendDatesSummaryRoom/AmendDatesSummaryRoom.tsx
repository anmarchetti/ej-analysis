import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getRoomsMeta } from 'frontend/utils/HolidaySummaryRoom.utils';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import AmendSummaryAccordion from 'frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion';

import styles from './AmendDatesSummaryRoom.module.scss';

interface IAmendDatesSummaryRoomProps {
    icon: ISitecoreField<ISitecoreImage>;
    title: ISitecoreField<string>;
}

function AmendDatesSummaryRoom({ icon, title }: IAmendDatesSummaryRoomProps) {
    const { units, getPhrase } = useStore((stores: IHolidaysStores) => ({
        units: stores.amendDatesStore.offer?.accom.unit,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!units?.length) {
        return null;
    }

    const roomsMeta = getRoomsMeta(units, getPhrase);

    return (
        <AmendSummaryAccordion dataTid='amend-dates-summary-rooms' icon={icon} title={title.value}>
            <div>
                {roomsMeta.map(({ rooms, board, boardForPeopleLabel }) => (
                    <div className={styles.boardRooms} key={board.code}>
                        <div className={styles.rooms}>
                            {rooms.map(({ roomNumber, forPeople, title, room }) => (
                                <div key={room.code} data-tid={room.code} className={styles.room}>
                                    <h4 className={styles.title}>{`${roomNumber}: ${title}`}</h4>
                                    <span className={styles.roomFor}>{forPeople}</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.board}>
                            <h4 className={styles.title}>{board.title}</h4>
                            <span>{boardForPeopleLabel}</span>
                        </div>
                    </div>
                ))}
            </div>
        </AmendSummaryAccordion>
    );
}

export default observer(AmendDatesSummaryRoom);
