import { FC } from 'react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { GenderType } from 'models/enum/GenderType';
import SiteSettings from 'models/enum/SiteSettings';

import styles from './ViewBookingHotel.module.scss';

export type TViewBookingPassengersProps = {
    adultsCount: number;
    adultsCountLabel: string;
    childrenCount: number;
    childrenCountLabel: string;
    infantsCount: number;
    infantsCountLabel: string;
    mainGuestSex: string;
};
const ViewBookingPassengers: FC<TViewBookingPassengersProps> = ({
    adultsCount,
    childrenCount,
    infantsCount,
    adultsCountLabel,
    childrenCountLabel,
    infantsCountLabel,
    mainGuestSex,
}) => {
    const { getSetting } = useStore((stores: TStores) => ({
        getSetting: stores.layoutStore.getSetting,
    }));
    const adultIcon = mainGuestSex === GenderType.Female ? SiteSettings.FemaleIcon : SiteSettings.MaleIcon;

    if (!adultsCount && !childrenCount && !infantsCount) {
        return null;
    }

    const paxGroups = [
        {
            label: adultsCountLabel,
            count: adultsCount,
            icon: adultsCount > 1 ? SiteSettings.AdultsIcon : adultIcon,
            dataTid: 'adults-label',
        },
        {
            label: childrenCountLabel,
            count: childrenCount,
            icon: childrenCount > 1 ? SiteSettings.ChildrenIcon : SiteSettings.ChildIcon,
            dataTid: 'children-label',
        },
        {
            label: infantsCountLabel,
            count: infantsCount,
            icon: infantsCount > 1 ? SiteSettings.InfantsIcon : SiteSettings.InfantIcon,
            dataTid: 'infants-label',
        },
    ];

    return (
        <div className={styles.detailsItem} data-tid='view-booking-hotel-details-item'>
            {paxGroups.map(item => {
                if (!item.count) return null;

                return (
                    <span className={styles.peopleCount} key={item.label}>
                        <span
                            className={styles.icon}
                            data-tid='view-booking-people-count-icon'
                            style={{
                                backgroundImage: `url(${cmsUrls.media(getSetting(item.icon))}`,
                            }}
                        />
                        <span data-tid={item.dataTid}>{item.label}</span>
                    </span>
                );
            })}
        </div>
    );
};

export default ViewBookingPassengers;
