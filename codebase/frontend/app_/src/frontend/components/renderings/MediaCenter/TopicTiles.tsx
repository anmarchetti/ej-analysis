import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import TopicTileItem, { ITopicTileItemFields } from './components/TopicTileItem';

interface ITopicTilesPropsFields {
    Title: ISitecoreField<string>;
    TopicsTiles: ISitecoreChildren<ITopicTileItemFields>[];
}

export type TTopicTilesProps = ISitecoreComponent<ITopicTilesPropsFields>;

const TopicTiles = (props: TTopicTilesProps) => {
    const { getSetting } = useStore((stores: TStores) => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const isDarkSiteMode = getSetting(SiteSettings.MediaCentreDarkSiteMode);

    if (isDarkSiteMode) {
        return null;
    }

    return (
        <div className='topic-tiles__container'>
            {!!props.fields?.Title && <Text className='topic-tiles__header' field={props.fields.Title} tag='h3' />}
            <div className='topic-tiles__block' data-tid='topic-tiles-block'>
                {!!props.fields?.TopicsTiles &&
                    props.fields?.TopicsTiles.map((el, idx) => (
                        <TopicTileItem key={`${el.name}_${idx}`} {...(el as any)} />
                    ))}
            </div>
        </div>
    );
};

export default TopicTiles;
