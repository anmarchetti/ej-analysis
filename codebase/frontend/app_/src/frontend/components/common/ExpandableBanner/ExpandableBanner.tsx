import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import ExpandableItem from 'frontend/components/common/ExpandableItem/ExpandableItem';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './ExpandableBanner.module.scss';

export interface IExpandableBannerProps {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
    dataTidPrefix: string;
    ButtonLabel?: ISitecoreField<string>;
    button?: React.ReactNode;
    descriptionClassName?: string;
    iconClassName?: string;
    isDefaultOpened?: boolean;
    isMobileView?: boolean;
    mobileClassName?: string;
    onButtonClick?: () => void;
    titleClassName?: string;
}

export const ExpandableBanner: FC<IExpandableBannerProps> = ({
    Title,
    Description,
    ButtonLabel,
    Icon,
    onButtonClick,
    dataTidPrefix,
    button,
    isMobileView,
    mobileClassName,
    descriptionClassName,
    titleClassName,
    iconClassName,
    isDefaultOpened,
}) => {
    const isMobile = useMobileViewport() || isMobileView;

    if (isMobile) {
        return (
            <div data-tid={dataTidPrefix} className={classNames(styles.ctaBlock, mobileClassName)}>
                <ExpandableItem
                    dataTid={`${dataTidPrefix}-expandable`}
                    className={styles.expandable}
                    titleWrapperClassName={styles.titleWrapper}
                    title={Title.value}
                    titleClassName={classNames(styles.title, titleClassName)}
                    icon={
                        <JSSImage
                            field={Icon}
                            className={classNames(styles.icon, iconClassName)}
                            data-tid={`${dataTidPrefix}-icon`}
                        />
                    }
                    isOpened={isDefaultOpened}
                >
                    <RichTextWithLinks
                        field={Description}
                        className={classNames(styles.text, descriptionClassName)}
                        dataId={`${dataTidPrefix}-text`}
                    />
                </ExpandableItem>
                {ButtonLabel?.value && (
                    <Button data-tid={`${dataTidPrefix}-btn`} onClick={onButtonClick} className={styles.button}>
                        {ButtonLabel.value}
                    </Button>
                )}
                {button}
            </div>
        );
    }

    return (
        <div data-tid={dataTidPrefix} className={styles.ctaBlock}>
            <JSSImage field={Icon} className={styles.icon} data-tid={`${dataTidPrefix}-icon`} />
            <div className={styles.mainContainer}>
                <div className={styles.textContainer}>
                    <Text field={Title} data-tid={`${dataTidPrefix}-title`} className={styles.title} tag='h3' />
                    <RichTextWithLinks field={Description} className={styles.text} dataId={`${dataTidPrefix}-text`} />
                </div>
                {ButtonLabel?.value && (
                    <Button data-tid={`${dataTidPrefix}-btn`} onClick={onButtonClick} className={styles.button}>
                        {ButtonLabel.value}
                    </Button>
                )}
                {button}
            </div>
        </div>
    );
};

export default ExpandableBanner;
