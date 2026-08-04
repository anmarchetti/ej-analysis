import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';

import styles from './ItineraryFeature.module.scss';

export interface IItineraryFeatureProps {
    dataTid: string;
    description: ISitecoreField<string>;
    icon: ISitecoreField<ISitecoreImage>;
    title: ISitecoreField<string>;
    className?: string;
    isExpanded?: boolean;
    tooltipText?: Nullable<string>;
}

const ItineraryFeature: FC<IItineraryFeatureProps> = ({
    title,
    description,
    icon,
    isExpanded,
    tooltipText,
    dataTid,
    className,
}) => (
    <div
        className={classNames(styles.feature, className, { [styles.expanded]: isExpanded })}
        data-tid={`itinerary-feature-${dataTid}`}
    >
        <div className={styles.heading} data-tid={`itinerary-feature-${dataTid}-heading`}>
            <JSSImageNext field={icon} className={styles.icon} />
            <Text field={title} tag='span' />
            {isExpanded && tooltipText && (
                <Tooltip placement='bottom'>
                    <TooltipTrigger className={styles.tooltipTrigger} />
                    <TooltipContent text={tooltipText} />
                </Tooltip>
            )}
        </div>
        {isExpanded && <Text field={description} tag='span' className={styles.description} />}
    </div>
);

export default ItineraryFeature;
