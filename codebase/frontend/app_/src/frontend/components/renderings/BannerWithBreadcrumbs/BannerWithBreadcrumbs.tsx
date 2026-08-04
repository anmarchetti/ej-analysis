import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import SlicedBannerImage from 'frontend/components/common/SlicedBannerImage/SlicedBannerImage';
import PathBreadcrumbs from 'frontend/components/renderings/DestinationBreadcrumbs';

import styles from './BannerWithBreadcrumbs.module.scss';

export interface IBannerWithBreadcrumbsFields {
    Image: ISitecoreField<ISitecoreImage>;
    Title?: ISitecoreField<string>;
}

export type TBannerWithBreadcrumbsProps = ISitecoreComponent<IBannerWithBreadcrumbsFields>;

export const BannerWithBreadcrumbs = (props: TBannerWithBreadcrumbsProps) => {
    if (!props.fields) {
        return null;
    }

    const { Title, Image } = props.fields;

    return (
        <div className={styles.container} data-tid='banner-with-breadcrumbs'>
            {Image?.value.src && <SlicedBannerImage image={Image} isBottomSlice />}
            <div className={styles.contentContainer}>
                <div className={classNames(styles.wrapper, 'wrapper-container wrapper-container--px')}>
                    <PathBreadcrumbs isOpaqueStyle />
                    <Text className={styles.title} field={Title} tag='h1' data-tid='banner-with-breadcrumbs-title' />
                </div>
            </div>
        </div>
    );
};

export default BannerWithBreadcrumbs;
