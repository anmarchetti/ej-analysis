import { FC } from 'react';
import classNames from 'classnames';

import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';

import styles from './TouristTaxTooltip.module.scss';

export interface ITouristTaxTooltip {
    children: React.ReactNode;
    tooltipText: string;
    dataId?: string;
    triggerClassName?: string;
}

export const TouristTaxTooltip: FC<ITouristTaxTooltip> = ({ children, tooltipText, triggerClassName, dataId }) => (
    <Tooltip>
        <TooltipTrigger tabIndex={0}>
            <div className={classNames(styles.trigger, triggerClassName)} data-tid={dataId}>
                {children}
            </div>
        </TooltipTrigger>
        <TooltipContent text={tooltipText} className={classNames(styles.content, styles.tooltipContent)} />
    </Tooltip>
);
