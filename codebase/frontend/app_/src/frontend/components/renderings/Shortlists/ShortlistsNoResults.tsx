import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useMount } from 'frontend/hooks/useMount';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitePath from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgHeart from 'frontend/components/icons/Heart';
import PathBreadcrumbs from 'frontend/components/renderings/DestinationBreadcrumbs';

import styles from './ShortlistsNoResults.module.scss';
interface IShortlistsNoResultsFields {
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TShortlistsNoResultsProps = ISitecoreComponent<IShortlistsNoResultsFields>;

const ShortlistsNoResults: FC<TShortlistsNoResultsProps> = props => {
    const { initialize, getBreadcrumb, trackShortlistView } = useStore((stores: IHolidaysStores) => ({
        initialize: stores.shortlistStore.initializeShortlists,
        getBreadcrumb: stores.layoutStore.getBreadcrumb,
        trackShortlistView: stores.trackingStore.trackShortlistView,
    }));

    useMount(() => {
        initialize();
        trackShortlistView([]);
    });

    if (!props.fields) return null;

    const { Title, Description } = props.fields;
    const breadcrumbs = [getBreadcrumb(SitePath.ShortlistsNoResults)];

    return (
        <div className='shortlist-no-results'>
            <PathBreadcrumbs breadcrumbs={breadcrumbs} />

            <div className='shortlist-no-results__content'>
                <SvgHeart className={styles.icon} />
                <Text className='shortlist-no-results__title' field={Title} tag='h1' />
                <RichTextWithLinks field={Description} />
            </div>
        </div>
    );
};

export default observer(ShortlistsNoResults);
