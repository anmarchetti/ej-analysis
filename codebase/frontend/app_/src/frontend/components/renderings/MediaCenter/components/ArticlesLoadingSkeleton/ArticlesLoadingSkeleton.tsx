import { FC } from 'react';
import classNames from 'classnames';

import styles from './ArticlesLoadingSkeleton.module.scss';

export const ArticlesLoadingSkeleton: FC = () => (
    <div className={styles.articlesWrapper} data-tid='articles-loading-skeleton'>
        <div className={classNames(styles.placeholderArticle, styles.fullWidth, 'placeholder-shimmer')} />
        <div className={classNames(styles.placeholderArticle, 'placeholder-shimmer')} />
        <div className={classNames(styles.placeholderArticle, 'placeholder-shimmer')} />
        <div className={classNames(styles.placeholderArticle, 'placeholder-shimmer')} />
    </div>
);

export default ArticlesLoadingSkeleton;
