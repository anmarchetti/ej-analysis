import React, { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classnames from 'classnames';

import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

import styles from './HeroSectionWrapper.module.scss';

interface IHeroSectionWrapperParams {
    IsSearchPodFloating: TSitecoreCheckboxValue;
}

type THeroSectionWrapperProps = ISitecoreComponent<null, IHeroSectionWrapperParams>;

const HeroSectionWrapper: FC<THeroSectionWrapperProps> = ({ rendering, params }) => {
    const isSearchPodFloating = isSitecoreCheckboxSelected(params?.IsSearchPodFloating);

    return (
        <div
            data-tid='hero-section-wrapper'
            className={classnames(styles.heroSectionWrapper, {
                [styles.heroSectionWrapperPositioned]: isSearchPodFloating,
            })}
        >
            <div
                data-tid='floating-searchpod-wrapper'
                className={classnames({
                    [`floating-searchpod ${styles.floatingSearchPodWrapper}`]: isSearchPodFloating,
                })}
            >
                <Placeholder
                    name={PlaceholderNames.HeroSearchpodWrapper}
                    rendering={rendering}
                    isFloating={isSearchPodFloating}
                    isParentWrapper
                />
            </div>
            <Placeholder name={PlaceholderNames.HeroCarouselWrapper} isBannerLower rendering={rendering} />
        </div>
    );
};

export default HeroSectionWrapper;
