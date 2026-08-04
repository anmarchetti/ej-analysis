import { FC, useMemo } from 'react';
import { observer } from 'mobx-react';

import { useLuxuryInternalFlight } from 'frontend/hooks/useLuxuryInternalFlight';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getGuestsAmountByType } from 'frontend/utils/luggage.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import AncillariesMainContent from 'frontend/components/common/Ancillaries/components/AncillariesMainContent/AncillariesMainContent';
import OutlineBanner, { OutlineBannerContext } from 'frontend/components/common/OutlineBanner/OutlineBanner';
import { OutlineBannerTheme } from 'frontend/components/common/OutlineBanner/OutlineBannerTheme';
import { ITextBlockFields } from 'frontend/components/renderings/TextBlock';

import styles from './LuggageForLuxurySeriesFlight.module.scss';

interface ILuggageForLuxurySeriesFlightFields {
    CabinBagContent?: ISitecoreCompositeField<ITextBlockFields>;
    CabinBagWithInfantContent?: ISitecoreCompositeField<ITextBlockFields>;
    HoldLuggageContent?: ISitecoreCompositeField<ITextBlockFields>;
    HoldLuggageWithInfantContent?: ISitecoreCompositeField<ITextBlockFields>;
}

export type TLuggageForLuxurySeriesFlightProps = ISitecoreComponent<ILuggageForLuxurySeriesFlightFields>;

export const LuggageForLuxurySeriesFlight: FC<TLuggageForLuxurySeriesFlightProps> = ({ fields }) => {
    const { isPostBookingPages, getPhrase, infants, booking } = useStore(
        ({ layoutStore, guestDetailsStore, viewBookingStore, bookingStore }: TStores) => ({
            isPostBookingPages: layoutStore.isPostBookingPages,
            getPhrase: layoutStore.getPhrase,
            infants: guestDetailsStore.infants,
            booking: viewBookingStore.booking || bookingStore.booking,
        }),
    );
    const isLuxuryInternalFlight = useLuxuryInternalFlight();
    const outlineBannerThemeValue = useMemo(
        () => ({
            theme: OutlineBannerTheme.LuxuryTheme,
        }),
        [],
    );

    if (!isLuxuryInternalFlight || !fields) {
        return null;
    }

    const { CabinBagContent, CabinBagWithInfantContent, HoldLuggageContent, HoldLuggageWithInfantContent } = fields;

    const infantsNumber =
        isPostBookingPages && booking ? getGuestsAmountByType(booking, booking.package.accom).infants : infants?.length;
    const cabinBagContent = infantsNumber ? CabinBagWithInfantContent : CabinBagContent;
    const holdLuggageContent = infantsNumber ? HoldLuggageWithInfantContent : HoldLuggageContent;

    const getItem = (item?: ISitecoreCompositeField<ITextBlockFields>): JSX.Element | null => {
        if (!item?.fields) {
            return null;
        }

        const { Title, Description, Icon } = item.fields;

        return (
            <AncillariesMainContent
                Subtitle={Title}
                Description={Description}
                Icon={Icon}
                dataTid='luxury-series-flight'
            />
        );
    };

    const content = (
        <div className={styles.container} data-tid='luggage-for-luxury-series-flight'>
            {getItem(cabinBagContent)}
            <hr />
            {getItem(holdLuggageContent)}
        </div>
    );

    return isPostBookingPages ? (
        <div className={styles.postBookingContainer} data-tid='luggage-for-luxury-series-flight-post-book'>
            <h2 className={styles.title}>{getPhrase(SitecoreDictionary.LuggageLabelsBags)}</h2>
            {content}
        </div>
    ) : (
        <OutlineBannerContext.Provider value={outlineBannerThemeValue}>
            <OutlineBanner>{content}</OutlineBanner>
        </OutlineBannerContext.Provider>
    );
};

export default observer(LuggageForLuxurySeriesFlight);
