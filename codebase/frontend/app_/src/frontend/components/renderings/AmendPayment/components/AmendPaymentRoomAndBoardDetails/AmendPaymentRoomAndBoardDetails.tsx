import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getAccommodationGuestsCount } from 'frontend/utils/accommodation.utils';
import HolidaySummaryPlainOptions from 'frontend/components/common/HolidaySummaryPlainOptions/HolidaySummaryPlainOptions';
import HolidaySummaryRoomAndBoard from 'frontend/components/common/HolidaySummaryRoomAndBoard/HolidaySummaryRoomAndBoard';

import styles from './AmendPaymentRoomAndBoardDetails.module.scss';

const AmendPaymentRoomAndBoardDetails: FunctionComponent = () => {
    const { chosenRoomVariant, booking } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        chosenRoomVariant: stores.amendRoomAndBoardStore.chosenRoomVariant,
        booking: stores.amendPaymentStore.booking,
    }));

    if (!chosenRoomVariant || !booking) {
        return null;
    }

    const hotel = {
        resort: {
            name: booking.hotel?.resort.name || '',
            region: booking.package.location.region,
        },
        name: booking.hotel?.name || '',
    };

    return (
        // eslint-disable-next-line eslintDataTidPlugin/data-tid-in-snake-case
        <div data-tid='amend-paymentRoom-and-board-details' className={styles.container}>
            <HolidaySummaryRoomAndBoard units={chosenRoomVariant.units} hotel={hotel} accom={booking.package.accom} />
            <HolidaySummaryPlainOptions guestsCount={getAccommodationGuestsCount(chosenRoomVariant.units)} />
        </div>
    );
};

export default observer(AmendPaymentRoomAndBoardDetails);
