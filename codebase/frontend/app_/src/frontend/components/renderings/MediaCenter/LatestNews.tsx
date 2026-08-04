import { FC, useEffect } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';

import ArticleCard from './components/ArticleCard/ArticleCard';
import ArticlesLoadingSkeleton from './components/ArticlesLoadingSkeleton/ArticlesLoadingSkeleton';

import styles from './LatestNews.module.scss';

const LatestNews: FC = () => {
    const { isLoadingLatestNews, latestNews, getLatestNews, getPhrase, getSetting } = useStore(
        (stores: IHolidaysStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            isLoadingLatestNews: stores.mediaCenterStore.isLoadingLatestNews,
            latestNews: stores.mediaCenterStore.latestNews,
            getLatestNews: stores.mediaCenterStore.getLatestNews,
            getSetting: stores.layoutStore.getSetting,
        }),
    );

    useEffect(() => {
        getLatestNews();
    }, [getLatestNews]);

    const label = getPhrase(SitecoreDictionary.MediaCenterLabelsLatestNews);

    if (isLoadingLatestNews) {
        return <ArticlesLoadingSkeleton />;
    }

    if (!latestNews?.length) {
        return null;
    }

    const isDarkSiteMode = getSetting(SiteSettings.MediaCentreDarkSiteMode);
    const newsForShowing = isDarkSiteMode ? latestNews.slice(0, 1) : latestNews;

    return (
        <div className={styles.articlesWrapper}>
            {newsForShowing.map((article, index) => (
                <ArticleCard
                    key={article.id}
                    item={article}
                    label={index === 0 ? label : null}
                    isFullWidth={index === 0}
                />
            ))}
        </div>
    );
};

export default observer(LatestNews);
