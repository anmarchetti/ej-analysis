import React, { FC, useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getImage } from 'frontend/utils/getImage';
import { MediaSize } from 'models/data/MediaSizeParams';
import { ImageSize } from 'models/enum/ImageSize';
import SitePath from 'models/enum/SitePath';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import PathBreadcrumbs from 'frontend/components/renderings/DestinationBreadcrumbs';

import styles from './ShortlistBanner.module.scss';

interface IShortlistBannerProps {
    title: ISitecoreField<string> | undefined;
}

const ShortlistBanner: FC<IShortlistBannerProps> = ({ title }) => {
    const { getBreadcrumb, image, prevPageBreadcrumb, savePrevPage } = useStore((stores: IHolidaysStores) => ({
        getBreadcrumb: stores.layoutStore.getBreadcrumb,
        image: stores.shortlistStore.shortlistHeroImage,
        prevPageBreadcrumb: stores.shortlistStore.prevPageBreadcrumb,
        savePrevPage: stores.shortlistStore.savePrevPage,
    }));

    const [imageURL, setImageURL] = useState<Nullable<string>>(null);

    useEffect(() => {
        if (!image?.large) {
            setImageURL(null);

            return;
        }

        const getImageURL = async (): Promise<void> => {
            const url = await getImage(image, ImageSize.Large);
            setImageURL(cmsUrls.media(url));
        };

        getImageURL();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image?.large]);

    useEffect(
        () => () => {
            savePrevPage(null);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const shortlistBreadcrumb = getBreadcrumb(SitePath.Shortlists);
    const breadcrumbs = prevPageBreadcrumb ? [prevPageBreadcrumb, shortlistBreadcrumb] : [shortlistBreadcrumb];

    return (
        <div className={styles.banner}>
            <JSSImageNext
                field={{
                    value: {
                        src: imageURL || '',
                    },
                }}
                priority
                fill
                mediaSize={{
                    mobile: MediaSize.Medium,
                    desktop: MediaSize.Large,
                    tablet: MediaSize.Large,
                }}
            />
            <div className={styles.imageShadow}>
                <div className={classNames(styles.wrapper, 'wrapper-container--px')}>
                    <PathBreadcrumbs breadcrumbs={breadcrumbs} />

                    <Text className={styles.title} field={title} tag='h1' />
                </div>
            </div>
        </div>
    );
};

export default observer(ShortlistBanner);
