import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import LikeBadge from 'frontend/components/common/LikeBadge';
import LuxuryBadge from 'frontend/components/common/LuxuryBadge/LuxuryBadge';
import OfferCardSlider from 'frontend/components/common/OfferCardSlider/OfferCardSlider';

import styles from './HolidayCardImage.module.scss';

interface IHolidayCardImageProps {
    fallbackImage: string;
    isLuxuryPackage: boolean;
    offer: IOffer;
}

export const HolidayCardImage: FC<IHolidayCardImageProps> = ({ offer, fallbackImage, isLuxuryPackage }) => {
    const { getPhrase, isWeLovePillEnabled } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isWeLovePillEnabled: stores.layoutStore.isWeLovePillEnabled,
    }));

    return (
        <div className={styles.cardImage} data-tid='hotel-card-image'>
            {isWeLovePillEnabled && !offer.accom?.isExt && (
                <LikeBadge text={getPhrase(SitecoreDictionary.IframePromotingHolidaysLabelsWeLove)} />
            )}

            {isLuxuryPackage && <LuxuryBadge wrapperClassName={styles.luxuryBadge} />}

            <div className='img-carousel-container'>
                <OfferCardSlider images={offer.hotel?.images} fallbackImage={fallbackImage} showIndex />
            </div>
        </div>
    );
};

export default observer(HolidayCardImage);
