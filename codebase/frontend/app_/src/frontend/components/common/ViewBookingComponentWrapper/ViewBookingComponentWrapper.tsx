import { FC, ReactNode } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';

import styles from './ViewBookingComponentWrapper.module.scss';

export type TViewBookingComponentWrapperProps = {
    children: ReactNode;
    Icon?: ISitecoreField<ISitecoreImage>;
    PrimaryButtonScreenReaderText?: ISitecoreField<string>;
    PrimaryButtonText?: ISitecoreField<string>;
    SecondaryButtonScreenReaderText?: ISitecoreField<string>;
    SecondaryButtonText?: ISitecoreField<string>;
    Subtitle?: ISitecoreField<string>;
    Title?: ISitecoreField<string>;
    bottomChildren?: React.ReactNode;
    className?: string;
    dataTid?: string;
    id?: string;
    onPrimaryButtonClick?: () => void;
    onSecondaryButtonClick?: () => void;
    useMasonryStyle?: boolean;
};

const ViewBookingComponentWrapper: FC<TViewBookingComponentWrapperProps> = ({
    Icon,
    Title,
    Subtitle,
    PrimaryButtonText,
    PrimaryButtonScreenReaderText,
    SecondaryButtonText,
    SecondaryButtonScreenReaderText,
    onPrimaryButtonClick,
    onSecondaryButtonClick,
    useMasonryStyle = false,
    dataTid,
    children,
    bottomChildren,
    className,
    id,
}) => (
    <div
        className={classNames(styles.container, className, { [styles.masonryItemContainer]: useMasonryStyle })}
        data-tid={dataTid}
        id={id}
    >
        <div>
            <Text tag='h2' className={styles.title} field={Title} data-tid='title' />
            <Text tag='h3' className={styles.subtitle} field={Subtitle} data-tid='subtitle' />
        </div>
        <div className={styles.contentContainer}>
            <div className={styles.content}>
                <JSSImageNext className={styles.icon} field={Icon} dataTid='icon' width={32} height={32} />
                {children}
            </div>
            {(PrimaryButtonText?.value || SecondaryButtonText?.value) && (
                <div className={styles.buttonContainer} data-tid='button-container'>
                    {PrimaryButtonText?.value && (
                        <Button
                            onClick={onPrimaryButtonClick}
                            aria-label={PrimaryButtonScreenReaderText?.value}
                            className={classNames(styles.btn, styles.btnPrimary)}
                            data-tid='primary-button'
                        >
                            {PrimaryButtonText.value}
                        </Button>
                    )}
                    {SecondaryButtonText?.value && (
                        <Button
                            onClick={onSecondaryButtonClick}
                            isOutlined
                            aria-label={SecondaryButtonScreenReaderText?.value}
                            className={classNames(styles.btn, styles.btnSecondary)}
                            data-tid='secondary-button'
                        >
                            {SecondaryButtonText.value}
                        </Button>
                    )}
                </div>
            )}
        </div>
        {bottomChildren}
    </div>
);

export default ViewBookingComponentWrapper;
