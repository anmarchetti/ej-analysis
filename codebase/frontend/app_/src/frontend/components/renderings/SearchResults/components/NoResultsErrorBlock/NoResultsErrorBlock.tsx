import * as React from 'react';
import { FC } from 'react';

import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';

import styles from './NoResultsErrorBlock.module.scss';

export interface INoResultsErrorBlockProps {
    children?: React.ReactNode;
    description?: string;
    icon?: string;
    title?: string;
}

const NoResultsErrorBlock: FC<INoResultsErrorBlockProps> = ({ children, title, description, icon }) => (
    <div className={styles.container} data-tid='no-results-block'>
        {!!icon && (
            <div className={styles.icon}>
                <JSSImageNext
                    field={{
                        value: {
                            src: icon,
                        },
                    }}
                    fill
                />
            </div>
        )}

        {children ?? (
            <>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </>
        )}
    </div>
);
export default NoResultsErrorBlock;
