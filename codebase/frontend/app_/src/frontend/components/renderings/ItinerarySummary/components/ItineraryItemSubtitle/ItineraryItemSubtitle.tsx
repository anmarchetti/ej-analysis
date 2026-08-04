import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import styles from './ItineraryItemSubtitle.module.scss';

export type TItineraryItemSubtitle = {
    content: string | JSX.Element;
    className?: string;
    contentClassName?: string;
    dataTid?: string;
    icon?: Nullable<JSX.Element>;
    showContent?: boolean;
    showSubtitle?: boolean;
    subtitle?: ISitecoreField<string>;
    subtitleClassName?: string;
};

const ItineraryItemSubtitle: FC<TItineraryItemSubtitle> = ({
    subtitle,
    content,
    dataTid,
    showSubtitle = true,
    showContent = true,
    icon,
    className,
    contentClassName,
    subtitleClassName,
}) => {
    if ((showSubtitle && !subtitle?.value) || (showContent && !content)) {
        return null;
    }

    return (
        <div className={className}>
            {icon}
            {showSubtitle && (
                <Text field={subtitle} className={classNames(styles.subtitle, subtitleClassName)} tag='h5' />
            )}
            {showContent && (
                <span
                    data-tid={dataTid}
                    className={classNames(styles.subtitleContent, contentClassName, {
                        [styles.withoutMargin]: !showSubtitle,
                    })}
                >
                    {content}
                </span>
            )}
        </div>
    );
};

export default ItineraryItemSubtitle;
