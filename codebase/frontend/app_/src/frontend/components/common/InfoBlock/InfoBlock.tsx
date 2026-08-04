import React, { FC, ReactElement } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import IconWarningCircle from 'frontend/components/icons/WarningCircle';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';

import styles from './infoBlock.module.scss';

export interface IInfoBlockProps {
    btnClass?: string;
    btnLabel?: ISitecoreField<string>;
    className?: string;
    contentClass?: string;
    ctaClass?: string;
    dataTid?: string;
    icon?: ISitecoreField<ISitecoreImage>;
    iconClass?: string;
    link?: ISitecoreField<ISitecoreLink>;
    onClick?: () => void;
    renderIcon?: () => ReactElement;
    text?: ISitecoreField<string>;
    textClass?: string;
    title?: ISitecoreField<string>;
    titleClassName?: string;
    withWarningIcon?: boolean;
}

const InfoBlock: FC<IInfoBlockProps> = ({
    title,
    text,
    icon,
    link,
    textClass,
    dataTid,
    className,
    titleClassName,
    withWarningIcon,
    btnClass,
    ctaClass,
    iconClass,
    contentClass,
    btnLabel,
    onClick,
    renderIcon,
}) => {
    const getIcon = (): ReactElement => {
        let svg = icon?.value?.src ? <JSSImage field={icon} /> : <SvgInfoFilled />;

        if (withWarningIcon) svg = <IconWarningCircle />;

        return (
            <div className={classNames(styles.icon, iconClass)} data-tid='info-block-icon'>
                {svg}
            </div>
        );
    };

    renderIcon ??= getIcon;

    const dataTidBase = dataTid ?? 'info-block';

    return (
        <div className={classNames(styles.container, 'no-print', className)} data-tid={dataTidBase}>
            <div data-tid='info-block-content' className={classNames(styles.content, contentClass)}>
                {renderIcon()}

                <div className={styles.info}>
                    {!!title && (
                        <Text
                            tag='h2'
                            className={classNames(styles.title, titleClassName)}
                            field={title}
                            data-tid={`${dataTidBase}-title`}
                        />
                    )}
                    {text && (
                        <RichTextWithLinks
                            className={classNames(styles.text, textClass)}
                            field={text}
                            dataId={`${dataTidBase}-text`}
                        />
                    )}
                </div>
            </div>
            {!!btnLabel?.value && !!onClick && (
                <Button
                    isOutlined
                    isSmall
                    onClick={onClick}
                    className={classNames(styles.button, ctaClass)}
                    dataTid={`${dataTidBase}-button`}
                >
                    {btnLabel.value}
                </Button>
            )}
            {!!link?.value?.href && (
                <RouterLink
                    link={link}
                    className={`btn btn--outlined btn--small ${btnClass}`}
                    dataId={`${dataTidBase}-link`}
                >
                    <span>{link.value.text}</span>
                </RouterLink>
            )}
        </div>
    );
};

export default InfoBlock;
