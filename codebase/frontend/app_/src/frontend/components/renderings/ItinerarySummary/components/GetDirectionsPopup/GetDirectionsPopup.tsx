import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { isIOS } from 'frontend/utils/browser.utils';
import { buildGetDirectionsAppleMapsUrl, buildGetDirectionsGoogleMapsUrl } from 'frontend/utils/map.utils';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { ILocation } from 'frontend/components/common/MapComponent/OldMap/MapDirectionsProptypes';
import WarningPopup from 'frontend/components/renderings/WarningPopup/WarningPopup';

import styles from './GetDirectionsPopup.module.scss';

export interface IGetDirectionsPopupProps {
    appleMapsLabel: ISitecoreField<string>;
    closeDrawerLabel: ISitecoreField<string>;
    coordinates: ILocation;
    directionsLabel: ISitecoreField<string>;
    googleMapsLabel: ISitecoreField<string>;
    mapsApplicationLabel: ISitecoreField<string>;
    onClose: () => void;
}

const GetDirectionsPopup: FC<IGetDirectionsPopupProps> = ({
    directionsLabel,
    mapsApplicationLabel,
    onClose,
    closeDrawerLabel,
    appleMapsLabel,
    googleMapsLabel,
    coordinates,
}) => {
    const isAppleMobileDevice = isIOS();

    return (
        <WarningPopup
            title={directionsLabel}
            description={mapsApplicationLabel}
            onClose={onClose}
            extraContent={
                <div className={styles.actionsContainer}>
                    <Button
                        role='link'
                        isSmall
                        onClick={() => window.open(buildGetDirectionsGoogleMapsUrl(coordinates))}
                        isFullWidth
                        dataTid='get-directions-popup-google-maps-btn'
                    >
                        <Text field={googleMapsLabel} tag='span' />
                    </Button>
                    {isAppleMobileDevice && (
                        <Button
                            role='link'
                            isSmall
                            onClick={() => window.open(buildGetDirectionsAppleMapsUrl(coordinates))}
                            isOutlined
                            isFullWidth
                            dataTid='get-directions-popup-apple-maps-btn'
                        >
                            <Text field={appleMapsLabel} tag='span' />
                        </Button>
                    )}
                    <Button
                        isSmall
                        onClick={onClose}
                        isTransparent
                        isFullWidth
                        dataTid='get-directions-popup-close-btn'
                    >
                        <Text field={closeDrawerLabel} tag='span' />
                    </Button>
                </div>
            }
        />
    );
};

export default GetDirectionsPopup;
