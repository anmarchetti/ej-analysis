import { useEffect } from 'react';

import { setBodyOverflow } from 'frontend/utils/ui.utils';
import IconLock from 'frontend/components/icons/Lock';

import styles from './AmendCheckingChangesLoader.module.scss';

export const DEFAULT_CHECKING_CHANGES_TEXT = "One moment, we're checking your changes...";

export interface IAmendCheckingChangesLoaderProps {
    description?: string;
    header?: string;
    icon?: JSX.Element;
}

const AmendCheckingChangesLoader = ({
    header,
    description,
    icon = <IconLock />,
}: IAmendCheckingChangesLoaderProps): JSX.Element => {
    useEffect(() => {
        setBodyOverflow('hidden');

        return (): void => {
            setBodyOverflow('');
        };
    }, []);

    return (
        <div className={styles.overlay} data-tid='amend-checking-changes-loader'>
            <output className={styles.container}>
                <div className={styles.iconContainer}>
                    <div className={styles.icon} />
                    {icon}
                </div>

                {(header || description) && (
                    <div className={styles.text}>
                        {header && <p className={styles.header}>{header}</p>}
                        {description && <p className={styles.description}>{description}</p>}
                    </div>
                )}
            </output>
        </div>
    );
};

export default AmendCheckingChangesLoader;
