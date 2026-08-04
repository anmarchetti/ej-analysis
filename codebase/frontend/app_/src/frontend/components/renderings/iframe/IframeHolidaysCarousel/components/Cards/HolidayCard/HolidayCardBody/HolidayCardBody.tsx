import { FC, Fragment } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { filterPackageIcons } from 'frontend/utils/offer.utils';
import { IOffer } from 'models/data/IOffer';
import { MediaSize } from 'models/data/MediaSizeParams';
import { HolidayThemesTypesCodes } from 'models/enum/HolidayThemes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';

import HolidayCardCTA from './components/HolidayCardCTA/HolidayCardCTA';
import HolidayCardFlight from './components/HolidayCardFlight/HolidayCardFlight';
import HolidayPrice from './components/HolidayPrice/HolidayPrice';

import styles from './HolidayCardBody.module.scss';

interface IHolidayCardBodyProps {
    hotelLink: string;
    isLuxuryPackage: boolean;
    offer: IOffer;
    shouldShowPrice: boolean;
}

const ICON_SIZE = 22;

export const HolidayCardBody: FC<IHolidayCardBodyProps> = ({ offer, hotelLink, shouldShowPrice, isLuxuryPackage }) => {
    const { getPhrase } = useStore(({ layoutStore }: TStores) => ({
        getPhrase: layoutStore.getPhrase,
    }));

    const packageIcons = offer.accom?.theme?.packageIcons || [];
    const transfer = offer.transfers?.[0] || null;

    const extraLuggage = offer.extraLuggageInfo;
    const bagName = isLuxuryPackage ? getPhrase(SitecoreDictionary.LuggageLabels26kgHoldBagPlural) : undefined;
    const icons = filterPackageIcons(packageIcons, transfer, extraLuggage, bagName, true);

    const routes = offer.transport?.routes || [];
    const { outbound, inbound } = getRouteByDirection(routes);

    return (
        <div className={styles.cardBody} data-tid='hotel-card-body'>
            <div className={styles.priceAndIconsBlock}>
                <div className={styles.packageIcons}>
                    {icons.map((icon, i) => (
                        <Fragment key={`${icon.key}-${i}`}>
                            <JSSImageNext
                                field={{ value: { src: icon.iconUrl } }}
                                mediaSize={MediaSize.Small}
                                width={ICON_SIZE}
                                height={ICON_SIZE}
                                data-tid={`${icon.key}_icon`}
                                className='icon--bg-image'
                            />
                            <div className='title visually-hidden'>{icon.name}</div>
                        </Fragment>
                    ))}
                </div>
                {shouldShowPrice && (
                    <div className={styles.price} data-tid='hotel-price'>
                        <HolidayPrice offer={offer} />
                    </div>
                )}
            </div>

            <div className={styles.flightDetails}>
                <HolidayCardFlight route={outbound} />

                <hr className={styles.divider} />

                <HolidayCardFlight route={inbound} />
            </div>

            <div className={styles.ctaContainer}>
                <HolidayCardCTA
                    hotelLink={hotelLink}
                    isLuxuryPackage={isLuxuryPackage}
                    isCityBreak={offer.accom?.theme?.code === HolidayThemesTypesCodes.City}
                />
            </div>
        </div>
    );
};

export default HolidayCardBody;
