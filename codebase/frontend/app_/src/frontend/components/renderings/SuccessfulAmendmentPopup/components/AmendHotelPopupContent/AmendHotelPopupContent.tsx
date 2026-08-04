import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SvgHotelLined from 'frontend/components/icons-new/HotelLined';
import styles from 'frontend/components/renderings/SuccessfulAmendmentPopup/SuccessfulAmendmentPopup.module.scss';

const AmendHotelPopupContent = () => {
    const { booking } = useStore((store: IHolidaysStores) => ({
        booking: store.viewBookingStore.booking,
    }));

    if (!booking) {
        return null;
    }

    return (
        <div className={styles.amendHotelContainer} data-tid='successful-amendment-hotel-popup-content'>
            <div className='d-flex align-items-center' data-tid='successful-amendment-hotel'>
                <SvgHotelLined className={styles.amendHotelIcon} data-tid='hotel-icon' />
                <span className={styles.amendHotelTitle} data-tid='amend-hotel-popup-content-title'>
                    <strong>{booking.hotel?.name}</strong>
                </span>
            </div>
        </div>
    );
};

export default observer(AmendHotelPopupContent);
