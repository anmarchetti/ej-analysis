import { FC, useMemo } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import AncillariesMainContent from 'frontend/components/common/Ancillaries/components/AncillariesMainContent/AncillariesMainContent';
import OutlineBanner, { OutlineBannerContext } from 'frontend/components/common/OutlineBanner/OutlineBanner';
import { OutlineBannerTheme } from 'frontend/components/common/OutlineBanner/OutlineBannerTheme';

import styles from './SeatsAndBagsLuxuryInternalFlight.module.scss';

export interface ISeatsAndBagsProps {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    LuxurySeriesSeatFlightsTitlePostBook: ISitecoreField<string>;
    SeriesSeatFlightsPageTitle: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
}

export const SeatsAndBagsLuxuryInternalFlight: FC<ISeatsAndBagsProps> = ({
    Description,
    Subtitle,
    Icon,
    SeriesSeatFlightsPageTitle,
    LuxurySeriesSeatFlightsTitlePostBook,
}) => {
    const { isExtrasPage, isPostBookingPages } = useStore(({ layoutStore }: TStores) => ({
        isExtrasPage: layoutStore.isExtrasPage,
        isPostBookingPages: layoutStore.isPostBookingPages,
    }));
    const outlineBannerThemeValue = useMemo(() => ({ theme: OutlineBannerTheme.LuxuryTheme }), []);

    return (
        <div
            data-tid='seats-and-bags-luxury-internal-flight'
            className={classNames('seats-and-bags', { [styles.postBookPageSeats]: isPostBookingPages })}
        >
            {isExtrasPage && (
                <Text
                    field={SeriesSeatFlightsPageTitle}
                    tag='h2'
                    className={styles.title}
                    data-tid='seats-and-bags-title'
                />
            )}
            <OutlineBannerContext.Provider value={outlineBannerThemeValue}>
                <OutlineBanner>
                    {!isExtrasPage && (
                        <Text
                            field={LuxurySeriesSeatFlightsTitlePostBook}
                            tag='h2'
                            className={styles.titleAlt}
                            data-tid='seats-and-bags-title'
                        />
                    )}
                    <div className={styles.luxurySeriesFlight} data-tid='luxury-series-flight'>
                        <AncillariesMainContent Description={Description} Icon={Icon} Subtitle={Subtitle} />
                    </div>
                </OutlineBanner>
            </OutlineBannerContext.Provider>
        </div>
    );
};

export default observer(SeatsAndBagsLuxuryInternalFlight);
