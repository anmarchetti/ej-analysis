import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isWordInSentence } from 'frontend/utils/string.utils';
import { IHealthEntryRequirement } from 'models/data/IBookingInfo';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreMultiListItem } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import TravelChecklistItem from './components/TravelChecklistItem/TravelChecklistItem';

import styles from './TravelChecklist.module.scss';

export type TTravelChecklistTitlesFields = {
    FCDO: ISitecoreField<string>;
    Insurance: ISitecoreField<string>;
    Passport: ISitecoreField<string>;
    Safety: ISitecoreField<string>;
};

export type TTravelChecklistFields = {
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    TitleKeys: ISitecoreMultiListItem<ISitecoreField<string>>[];
} & TTravelChecklistTitlesFields;

export type TTravelChecklistProps = ISitecoreComponent<TTravelChecklistFields>;

type TTravelChecklistItemToShow = IHealthEntryRequirement & { mainTitle: string };

const TravelChecklist: FunctionComponent<TTravelChecklistProps> = ({ fields }) => {
    const { booking } = useStore(stores => ({
        booking: stores.viewBookingStore.booking,
    }));

    if (!fields || !booking) {
        return null;
    }

    const { Title, Description, TitleKeys = [] } = fields;
    const { healthEntryRequirements } = booking;

    const sitecoreTitleFieldNames = TitleKeys.map(el => el?.fields?.Value?.value).filter(Boolean);

    const travelChecklistItemsToShow = healthEntryRequirements.reduce((acc, el) => {
        const sitecoreTitleFieldName = sitecoreTitleFieldNames.find(titleKey =>
            isWordInSentence(el.trackingLabel, titleKey),
        );
        const mainTitle = sitecoreTitleFieldName ? fields[sitecoreTitleFieldName]?.value : undefined;

        if (mainTitle) {
            acc.push({ ...el, mainTitle });
        }

        return acc;
    }, [] as TTravelChecklistItemToShow[]);

    return (
        <div className={styles.container} data-tid='travel-checklist-container'>
            <section className={styles.descriptionSection}>
                <Text field={Title} tag='h2' className={styles.title} data-tid='travel-checklist-title' />
                <RichTextWithLinks
                    field={Description}
                    className={styles.description}
                    dataId='travel-checklist-description'
                />
            </section>
            <section className={styles.checklistSection}>
                {travelChecklistItemsToShow.map(({ mainTitle, title, description, cta, trackingLabel }, idx) => (
                    <TravelChecklistItem
                        key={`travel-checklist-checkbox-${idx}`}
                        subtitle={title}
                        description={description}
                        link={cta}
                        trackingLabel={trackingLabel}
                        title={mainTitle}
                    />
                ))}
            </section>
        </div>
    );
};

export default observer(TravelChecklist);
