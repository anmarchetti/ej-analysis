import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import AncillariesHeader from 'frontend/components/common/Ancillaries/components/AncillariesHeader/AncillariesHeader';
import AncillariesMainContent from 'frontend/components/common/Ancillaries/components/AncillariesMainContent/AncillariesMainContent';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';

import styles from './FastTrackAndSpeedyBoarding.module.scss';

export interface IFastTrackAndSpeedyBoardingFields {
    BannerTitle: ISitecoreField<string>;
    FastTrackDescription: ISitecoreField<string>;
    FastTrackIcon: ISitecoreField<ISitecoreImage>;
    FastTrackTitle: ISitecoreField<string>;
    SpeedyBoardingDescription: ISitecoreField<string>;
    SpeedyBoardingIcon: ISitecoreField<ISitecoreImage>;
    SpeedyBoardingTitle: ISitecoreField<string>;
}

export type TFastTrackAndSpeedyBoardingProps = ISitecoreComponent<IFastTrackAndSpeedyBoardingFields>;

const FastTrackAndSpeedyBoarding: FC<TFastTrackAndSpeedyBoardingProps> = ({ fields }) => {
    const { isLuxuryPackage, getPhrase } = useStore(({ bookingStore, layoutStore }) => ({
        isLuxuryPackage: bookingStore.isLuxuryPackage,
        getPhrase: layoutStore.getPhrase,
    }));

    if (!fields || !isLuxuryPackage) {
        return null;
    }

    const {
        BannerTitle,
        SpeedyBoardingTitle,
        SpeedyBoardingDescription,
        SpeedyBoardingIcon,
        FastTrackDescription,
        FastTrackTitle,
        FastTrackIcon,
    } = fields;

    return (
        <div className={styles.container} data-tid='fast-track-speedy-boarding'>
            <AncillariesHeader title={BannerTitle} dataTid='fast-track-speedy-boarding-header' />
            <LuxuryWrapper label={getPhrase(SitecoreDictionary.LuggageLabelsIncluded)}>
                <div className={styles.contentContainer} data-tid='fast-track-speedy-boarding-content'>
                    <AncillariesMainContent
                        Subtitle={FastTrackTitle}
                        Description={FastTrackDescription}
                        Icon={FastTrackIcon}
                        dataTid='fast-track'
                    />
                    <hr />
                    <AncillariesMainContent
                        Subtitle={SpeedyBoardingTitle}
                        Description={SpeedyBoardingDescription}
                        Icon={SpeedyBoardingIcon}
                        dataTid='speedy-boarding'
                    />
                </div>
            </LuxuryWrapper>
        </div>
    );
};

export default observer(FastTrackAndSpeedyBoarding);
