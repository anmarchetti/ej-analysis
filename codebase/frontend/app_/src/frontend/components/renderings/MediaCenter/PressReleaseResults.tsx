import { FC, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { isLoadedStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Pagination from 'frontend/components/common/Pagination';
import NoResultsErrorBlock from 'frontend/components/renderings/SearchResults/components/NoResultsErrorBlock/NoResultsErrorBlock';

import ArticleCard from './components/ArticleCard/ArticleCard';

import styles from './PressReleaseResults.module.scss';

const PressReleaseResults: FC = () => {
    const {
        getPhrase,
        status,
        currentPage,
        itemsOnEachPage,
        articles,
        numberOfArticles,
        numberOfPages,
        fetchArticles,
        setPageNumber,
        getFormattedNumber,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        status: stores.mediaCenterStore.status,
        currentPage: stores.mediaCenterStore.page,
        itemsOnEachPage: stores.mediaCenterStore.articlesNumberToTake,
        articles: stores.mediaCenterStore.articles,
        numberOfArticles: stores.mediaCenterStore.numberOfArticles,
        numberOfPages: stores.mediaCenterStore.numberOfPages,
        fetchArticles: stores.mediaCenterStore.fetchArticles,
        setPageNumber: stores.mediaCenterStore.setPageNumber,
        getFormattedNumber: stores.marketStore.getFormattedNumber,
    }));

    useEffect(() => {
        fetchArticles();
    }, []);

    useEffect(() => {
        if (isLoadedStatus(status)) {
            window.scrollTo(0, 0);
        }
    });

    const articlesCount = useMemo(
        () =>
            Tokenizer.replaceToken(
                getPhrase(SitecoreDictionary.MediaCenterLabelsResults),
                Tokens.Number,
                getFormattedNumber(numberOfArticles),
            ),
        [numberOfArticles],
    );

    const isShowPagination = !!articles?.length && numberOfArticles > itemsOnEachPage;

    if (!isLoadedStatus(status)) {
        return null;
    }

    return (
        <div className='hotel-search-results-box'>
            <div className='hotel-search-results-header'>
                <div className='results-count'>
                    <p>{articlesCount}</p>
                </div>
            </div>

            {!!articles?.length && (
                <>
                    <div className={styles.articlesWrapper}>
                        {articles.map((article, index) => (
                            <ArticleCard key={index} item={article} isFullWidth={currentPage === 1 && index === 0} />
                        ))}
                    </div>
                    {isShowPagination && (
                        <Pagination
                            fetchResults={fetchArticles}
                            numberOfResults={numberOfArticles}
                            numberOfPages={numberOfPages}
                            itemsOnEachPage={itemsOnEachPage}
                            currentPage={currentPage}
                            setCurrentPage={setPageNumber}
                            mobilePaginationDisabled
                        />
                    )}
                </>
            )}

            {!articles?.length && (
                <NoResultsErrorBlock
                    title={getPhrase(SitecoreDictionary.MediaCenterErrorsLoadingPressReleasesTitle)}
                    description={getPhrase(SitecoreDictionary.MediaCenterErrorsLoadingPressReleasesDescription)}
                />
            )}
        </div>
    );
};

export default observer(PressReleaseResults);
