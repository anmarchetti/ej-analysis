import { FC, useMemo } from 'react';
import { RichText } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n, getDaysDifference } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { HolidayThemesTypesCodes } from 'models/enum/HolidayThemes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import styles from './IframeHolidaysHeader.module.scss';

interface IIframeHolidaysHeaderFields {
    CityBreakTitle: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TIframeHolidaysHeaderProps = ISitecoreComponent<IIframeHolidaysHeaderFields>;

const IframeHolidaysHeader: FC<TIframeHolidaysHeaderProps> = ({ fields }) => {
    const { getPhrase, from, to, totalGuestsQuantity, offers } = useStore((stores: IHolidaysStores) => ({
        offers: stores.hotelsStore.offers,
        getPhrase: stores.layoutStore.getPhrase,
        from: stores.searchStore.searchWhen.from,
        to: stores.searchStore.searchWhen.to,
        totalGuestsQuantity: stores.searchStore.searchWho.totalGuestsQuantity,
    }));

    const subtitle = useMemo(() => {
        const subtitle = fields?.Subtitle?.value;

        if (!from || !to || !totalGuestsQuantity || !subtitle) return '';

        const date = formatDateL10n(from, 'D MMMM');
        const nights = getDaysDifference(new Date(to), new Date(from));
        const nightLabel = getPhrase(
            nights === 1 ? SitecoreDictionary.GlobalsLabelsNightSingular : SitecoreDictionary.GlobalsLabelsNightsPlural,
        );
        const peopleLabel = getPhrase(
            totalGuestsQuantity === 1
                ? SitecoreDictionary.IframePromotingHolidaysLabelsPeopleSingular
                : SitecoreDictionary.IframePromotingHolidaysLabelsPeoplePlural,
        );

        return Tokenizer.replaceTokens(subtitle, {
            [Tokens.Date]: date,
            [Tokens.Duration]: `${nights} ${nightLabel}`,
            [Tokens.People]: `${totalGuestsQuantity} ${peopleLabel}`,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields, from, to, totalGuestsQuantity]);

    if (!fields) return null;

    const areOnlyCityBreaks = offers?.every(offer => offer.accom?.theme?.code === HolidayThemesTypesCodes.City);

    const title = areOnlyCityBreaks ? fields.CityBreakTitle : fields.Title;

    return (
        <div className={styles.header} data-tid='header'>
            <RichText tag='h1' field={title} />
            {subtitle && <RichText tag='p' data-tid='subtitle' field={{ value: subtitle }} />}
        </div>
    );
};

export default observer(IframeHolidaysHeader);
