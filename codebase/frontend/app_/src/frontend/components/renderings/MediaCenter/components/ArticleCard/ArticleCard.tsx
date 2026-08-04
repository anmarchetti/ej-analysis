import { FC } from 'react';
import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import { useMoreThenMobileViewport, useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IArticle } from 'models/data/IArticle';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RouterLink from 'frontend/components/common/RouterLink';
import ArticleMetaData from 'frontend/components/renderings/MediaCenter/components/ArticleMetaData/ArticleMetaData';

import styles from './ArticleCard.module.scss';

export interface IArticleCardProps {
    item: IArticle;
    isFullWidth?: boolean;
    label?: Nullable<string>;
}

export const ArticleCard: FC<IArticleCardProps> = ({ item, isFullWidth, label }) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMoreThenTabletViewport = useMoreThenTabletViewport();
    const isMoreThenMobileViewport = useMoreThenMobileViewport();

    const { url, image, title, topics, publicationDate, shortDescription } = item;

    const linkToFullArticle = { value: { href: url || '' } } as any;
    const mediaSize =
        (isMoreThenMobileViewport && !isMoreThenTabletViewport) || isFullWidth ? MediaSize.Medium : MediaSize.Small;

    return (
        <RouterLink link={linkToFullArticle} className={classNames(styles.article, isFullWidth && styles.fullWidth)}>
            {!!label && <div className={styles.label}>{label}</div>}
            {image && (
                <div className={styles.media} data-tid='article-card-media'>
                    <div
                        className={styles.image}
                        style={{
                            backgroundImage: `url(${cmsUrls.media(image, getMediaSizeParams(mediaSize))})`,
                        }}
                    />
                </div>
            )}
            <div className={styles.info}>
                {title && (
                    <h3 className={styles.header} data-tid='article-card-title'>
                        <RouterLink link={linkToFullArticle} className={styles.title}>
                            {title}
                        </RouterLink>
                    </h3>
                )}
                <ArticleMetaData topics={topics} date={publicationDate} className={styles.additionalData} />
                {shortDescription && (
                    <div className={styles.text} data-tid='article-card-text'>
                        {shortDescription}{' '}
                        <RouterLink link={linkToFullArticle}>
                            {getPhrase(SitecoreDictionary.MediaCenterLabelsReadMore)}
                        </RouterLink>
                    </div>
                )}
            </div>
        </RouterLink>
    );
};

export default ArticleCard;
