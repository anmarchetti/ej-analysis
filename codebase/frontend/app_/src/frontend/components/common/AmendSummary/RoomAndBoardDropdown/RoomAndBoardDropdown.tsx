import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getRoomsMeta } from 'frontend/utils/HolidaySummaryRoom.utils';
import { IUnit } from 'models/data/IOffer';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import AmendSummaryAccordion from 'frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion';
import EditButton from 'frontend/components/common/AmendSummary/EditButton/EditButton';

import styles from './RoomAndBoardDropdown.module.scss';

export interface IRoomAndBoardDropdownProps {
    icon: ISitecoreField<ISitecoreImage>;
    title: ISitecoreField<string>;
    unit: IUnit[];
    CTALabel?: ISitecoreField<string>;
    onClickEditCTA?: () => void;
}

const RoomAndBoardDropdown: FunctionComponent<IRoomAndBoardDropdownProps> = ({
    icon,
    title,
    unit,
    onClickEditCTA,
    CTALabel,
}) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!unit?.length) {
        return null;
    }

    const roomsMeta = getRoomsMeta(unit, getPhrase);

    return (
        <AmendSummaryAccordion
            dataTid='amend-summary-room-and-board'
            icon={icon}
            title={title.value}
            className={styles.content}
        >
            {roomsMeta.map(({ rooms, board, boardForPeopleLabel }) => (
                <div className={styles.boardRooms} key={board.code}>
                    <div className={styles.rooms}>
                        {rooms.map(({ roomNumber, forPeople, title, room }) => {
                            const stringTitle = typeof title === 'string' ? title : title.value;

                            return (
                                <div key={room.code} data-tid={room.code} className={styles.room}>
                                    <h4 className={styles.title}>{`${roomNumber}: ${stringTitle}`}</h4>
                                    <span className={styles.roomFor}>{forPeople}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className={styles.board}>
                        <h4 className={styles.title}>{board.title}</h4>
                        <span>{boardForPeopleLabel}</span>
                    </div>
                </div>
            ))}
            {onClickEditCTA && CTALabel && (
                <EditButton onClick={onClickEditCTA}>
                    <Text field={CTALabel} />
                </EditButton>
            )}
        </AmendSummaryAccordion>
    );
};

export default observer(RoomAndBoardDropdown);
