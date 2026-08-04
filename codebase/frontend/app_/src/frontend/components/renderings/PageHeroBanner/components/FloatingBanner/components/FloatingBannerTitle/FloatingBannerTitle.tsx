import React, { FC } from 'react';
import classNames from 'classnames';

import { ENGLISH } from 'code/cmsLang';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IHeroBannerHeadingProps } from 'models/data/IHeroBanner';

import styles from './FloatingBannerTitle.module.scss';

const FloatingBannerTitle: FC<IHeroBannerHeadingProps> = ({ ComposedTitle, Title, Name, Subtitle, className }) => {
    const { siteLang } = useStore((stores: TStores) => ({
        siteLang: stores.layoutStore.lang,
    }));

    const text =
        siteLang !== ENGLISH && !!ComposedTitle?.value
            ? ComposedTitle?.value
            : `${Title?.value || Name?.value} ${Subtitle?.value}`;

    return (
        <h1 className={classNames(styles.title, className)} data-tid='floating-banner-title'>
            {text}
        </h1>
    );
};

export default FloatingBannerTitle;
