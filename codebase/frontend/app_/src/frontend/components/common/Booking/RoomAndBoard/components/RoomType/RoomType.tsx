import { FC } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { getGuestsAmountInRoom } from 'frontend/utils/accommodation.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IRoom } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import styles from 'frontend/components/common/Booking/RoomAndBoard/RoomAndBoard.module.scss';
import SvgHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';

interface IRoomTypeProps {
    room: IRoom;
    roomNumber: number;
}

const RoomType: FC<IRoomTypeProps> = ({ room, roomNumber }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const guestsInRoom = getGuestsAmountInRoom(room.occupation);

    const roomIndexTitle = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.RoomTypesLabelsRoom),
        Tokens.Number,
        `${roomNumber}`,
    );

    const title = room.roomType?.title;
    const titleText = typeof title === 'object' ? title?.value : title;

    return (
        <div data-tid='room-type'>
            <div className={styles.roomNumberContainer}>
                <div className={styles.hotelIcon} data-tid='hotel-icon'>
                    <SvgHotelBedFilled />
                </div>
                <h4 className='holiday-summary-item__subtitle' data-tid='room-index-subtitle'>
                    {roomIndexTitle}
                </h4>
            </div>
            {!!title && (
                <h4 className={styles.roomTitle} data-tid='room-subtitle'>
                    {titleText}
                </h4>
            )}
            <div className='holiday-summary-item__text' data-tid='room-text'>
                {Tokenizer.replaceToken(
                    getPhrase(
                        guestsInRoom > 1
                            ? SitecoreDictionary.BookingSummaryLabelsForPeople
                            : SitecoreDictionary.BookingSummaryLabelsForPerson,
                    ),
                    Tokens.People,
                    `${guestsInRoom}`,
                )}
            </div>
        </div>
    );
};

export default RoomType;
