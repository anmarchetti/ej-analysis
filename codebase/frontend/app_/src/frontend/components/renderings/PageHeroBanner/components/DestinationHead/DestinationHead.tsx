import React, { FC } from 'react';
import Head from 'next/head';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISSRPageHeroBannerProps } from 'models/data/IHeroBanner';
import SiteSettings from 'models/enum/SiteSettings';

const DestinationHead: FC<ISSRPageHeroBannerProps> = ({ cheapestLivePriceForDestinationPage }) => {
    const {
        metaPageTitle,
        metaPropertiesFromSettings,
        getSetting,
        metaPageDescription,
        replaceDescription,
        replaceName,
        replaceLivePrice,
    } = useStore((stores: TStores) => ({
        metaPageTitle: stores.metadataStore.metaPageTitle,
        metaPropertiesFromSettings: stores.metadataStore.metaPropertiesFromSettings,
        getSetting: stores.layoutStore.getSetting,
        metaPageDescription: stores.metadataStore.metaPageDescription,
        replaceDescription: stores.metadataStore.replaceDescription,
        replaceName: stores.metadataStore.replaceName,
        replaceLivePrice: stores.metadataStore.replaceLivePrice,
    }));

    const getMetaData = (
        content: string,
        setting: SiteSettings | undefined,
        callback: (content: string) => string,
    ): string => {
        if (content) {
            return replaceLivePrice(content, cheapestLivePriceForDestinationPage);
        }

        if (setting) {
            const replacedSetting = callback(getSetting(setting));

            return replaceLivePrice(replacedSetting, cheapestLivePriceForDestinationPage);
        }

        return '';
    };

    const title = getMetaData(metaPageTitle, metaPropertiesFromSettings?.title, replaceName);
    const description = getMetaData(metaPageDescription, metaPropertiesFromSettings?.description, replaceDescription);

    return (
        <Head>
            <title>{title}</title>
            <meta property='og:title' content={title} />
            <meta name='description' content={description} />
            <meta property='og:description' content={description} />
        </Head>
    );
};

export default DestinationHead;
