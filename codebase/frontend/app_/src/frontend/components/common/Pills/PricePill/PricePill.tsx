import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';

import styles from './PricePill.module.scss';

export interface IPricePillProps {
    children: any;
    className?: string;
    isBlack?: boolean;
    isFullWidth?: boolean;
    isGreen?: boolean;
    isLightGreen?: boolean;
    isLightRed?: boolean;
    isRed?: boolean;
    isSmall?: boolean;
    isTooltipOnRight?: boolean;
    isWarning?: boolean;
    isYellow?: boolean;
    tooltipMessage?: string;
}

export const PricePill: FC<IPricePillProps> = props => {
    const className = classNames(
        'price-pill',
        'no-print',
        props.className,
        props.isSmall && 'price-pill--small',
        props.isGreen && 'price-pill--green',
        props.isBlack && 'price-pill--black',
        props.isRed && 'price-pill--red',
        props.isYellow && 'price-pill--yellow',
        props.isWarning && 'price-pill--warning',
        props.isLightGreen && 'price-pill--lightGreen',
        props.isLightRed && 'price-pill--lightRed',
        props.isFullWidth && 'price-pill--fullWidth',
        props.tooltipMessage && props.isTooltipOnRight && 'price-pill--tooltip-right',
    );

    const textContent = <span className='price-pill__text'>{props.children}</span>;

    return (
        <div className={classNames(className, styles.pricePill)} data-tid='price-pill'>
            {props.tooltipMessage ? (
                <>
                    <Tooltip>
                        <TooltipTrigger className={classNames(styles.tooltipTrigger, 'more-info')} />
                        <TooltipContent>
                            <div>{props.tooltipMessage}</div>
                        </TooltipContent>
                    </Tooltip>
                    {textContent}
                </>
            ) : (
                textContent
            )}
        </div>
    );
};

export default observer(PricePill);
