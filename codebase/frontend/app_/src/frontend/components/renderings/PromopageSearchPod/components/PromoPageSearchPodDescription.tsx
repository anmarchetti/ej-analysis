import React, { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SeoReadMoreTextBlock from 'frontend/components/common/SeoReadMoreTextBlock';

export interface IPromopageSearchPodProps {
    PromoDescription: ISitecoreField<string>;
    EnableSeoReadMoreText?: TSitecoreCheckboxValue;
    rendering?: any;
}

const PromoPageSearchPodDescription: FC<IPromopageSearchPodProps> = ({
    PromoDescription,
    EnableSeoReadMoreText,
    rendering,
}) => {
    const { isFiltersLoadingScreenDisplayed } = useStore(stores => ({
        isFiltersLoadingScreenDisplayed: stores.searchFiltersStore.isFiltersLoadingScreenDisplayed,
    }));

    if (!PromoDescription?.value || isFiltersLoadingScreenDisplayed) {
        return null;
    }

    return (
        <div className='wrapper-component-container wrapper-component-container--grey next-is-sticky'>
            <div className='wrapper-shape'>
                <div className='wrapper-component-container__inner'>
                    {!isSitecoreCheckboxSelected(EnableSeoReadMoreText) ? (
                        <RichTextWithLinks field={PromoDescription} className='promopage-search-pod-description' />
                    ) : (
                        <SeoReadMoreTextBlock
                            className='promopage-search-pod-description'
                            text={PromoDescription.value}
                            dataTid='promopage-search-pod-description'
                        />
                    )}
                    <Placeholder name={PlaceholderNames.InformationTiles} rendering={rendering} />
                    <Placeholder name={PlaceholderNames.TilesCarousel} rendering={rendering} />
                </div>
            </div>
        </div>
    );
};

export default observer(PromoPageSearchPodDescription);
