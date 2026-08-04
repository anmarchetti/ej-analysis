import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './QuestionHeader.module.scss';

export type TQuestionHeaderProps = {
    description?: string;
    id?: string;
    tag?: 'legend' | 'label' | 'div';
    title?: string;
};

const QuestionHeader: FC<TQuestionHeaderProps> = ({ title, description, tag = 'div', id }) => {
    const Tag = tag;

    if (!title && !description) {
        return null;
    }

    return (
        <Tag className={styles.content} id={id}>
            <Text tag='div' field={{ value: title }} className={styles.title} />
            {description && (
                <RichTextWithLinks tag='div' field={{ value: description }} className={styles.description} />
            )}
        </Tag>
    );
};

export default QuestionHeader;
