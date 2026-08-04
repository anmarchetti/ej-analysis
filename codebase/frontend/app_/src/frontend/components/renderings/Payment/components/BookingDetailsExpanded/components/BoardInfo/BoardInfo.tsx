import React from 'react';

import { IBoardType } from 'models/data/IHotel';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';
import styles from 'frontend/components/renderings/Payment/components/BookingDetailsExpanded/BookingDetailsExpanded.module.scss';

export interface IBoardInfoProps {
    board: Nullable<IBoardType>;
}

const BoardInfo: React.FC<IBoardInfoProps> = ({ board }: IBoardInfoProps) => {
    if (!board || !(board.title || board.content)) return null;

    return (
        <div data-tid='board-container' className={styles.blockItem}>
            <BoardTypeIcon iconUrl={board.iconUrl} className={styles.bgIcon} />

            {board.title && (
                <div className={styles.head} data-tid='board-title'>
                    {board.title}
                </div>
            )}

            {board.content && (
                <div
                    className='booking-details-board-description'
                    data-tid='board-description'
                    dangerouslySetInnerHTML={{ __html: board.content }}
                />
            )}
        </div>
    );
};

export default BoardInfo;
