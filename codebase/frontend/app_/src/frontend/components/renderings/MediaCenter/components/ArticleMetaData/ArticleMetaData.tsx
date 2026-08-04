import { FC, Fragment } from 'react';

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import TopicLink from 'frontend/components/renderings/MediaCenter/components/TopicLink';

import styles from './ArticleMetaData.module.scss';

export interface IArticleMetaDataProps {
    className: string;
    date: string;
    topics?: string[];
}

export const ArticleMetaData: FC<IArticleMetaDataProps> = props => (
    <div className={props.className}>
        <span className='date-published'>{formatDateL10n(props.date, DATE_FORMATS.ordinalDateWithAbbrMonthName)}</span>
        {!!props.topics?.length && (
            <>
                <span className={styles.delimiter} data-tid='delimiter' />
                <span className={styles.topics} data-tid='topics'>
                    {props.topics.map((topic, index) => (
                        <Fragment key={topic}>
                            {!!index && ', '}
                            <TopicLink topic={topic}>{topic}</TopicLink>
                        </Fragment>
                    ))}
                </span>
            </>
        )}
    </div>
);

export default ArticleMetaData;
