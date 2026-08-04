import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import styles from './HolidayCardCTA.module.scss';

interface IHolidayCardCTAProps {
    hotelLink: string;
    isCityBreak: boolean;
    isLuxuryPackage: boolean;
}

const HolidayCardCTA: FC<IHolidayCardCTAProps> = ({ hotelLink, isLuxuryPackage, isCityBreak }) => {
    const { getPhrase } = useStore(({ layoutStore }: TStores) => ({
        getPhrase: layoutStore.getPhrase,
    }));

    const getLinkText = (): string => {
        if (isLuxuryPackage) {
            return getPhrase(SitecoreDictionary.IframePromotingHolidaysButtonsViewLuxuryHoliday);
        }

        if (isCityBreak) {
            return getPhrase(SitecoreDictionary.IframePromotingHolidaysButtonsViewCityBreak);
        }

        return getPhrase(SitecoreDictionary.IframePromotingHolidaysButtonsViewHoliday);
    };

    return (
        <a
            className={classNames('btn btn--full-width', styles.cardCTA)}
            target='_blank'
            rel='noreferrer'
            href={hotelLink}
            data-tid='view-holiday-btn'
        >
            {getLinkText()}
        </a>
    );
};

export default HolidayCardCTA;
