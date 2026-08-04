import { ElementType, FC } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';

import { getSplitText } from './TextWithTooltip.utils';

import styles from './TextWithTooltip.module.scss';

export interface ITextWithTooltipProps {
    message: string;
    tooltipMessage: string;
    dataTid?: string;
    icon?: JSX.Element;
    tag?: string;
    tooltipTriggerClassName?: string;
    wrapperClassName?: string;
}

export const TextWithTooltip: FC<ITextWithTooltipProps> = ({
    message,
    tooltipMessage,
    tooltipTriggerClassName,
    wrapperClassName,
    dataTid,
    tag = 'div',
    icon,
}) => {
    if (!message) {
        return null;
    }

    // Use upper case letter to avoid TypeScript error about 'JSX.IntrinsicElements'
    const WrapperTag = tag as ElementType;
    const [text, lastWord] = getSplitText(message);

    return (
        <WrapperTag className={wrapperClassName} data-tid={dataTid}>
            {text}
            <span className={styles.lastWord}>
                {lastWord}
                {!!tooltipMessage && (
                    <Tooltip>
                        <TooltipTrigger className={tooltipTriggerClassName}>{icon}</TooltipTrigger>
                        <TooltipContent text={tooltipMessage} />
                    </Tooltip>
                )}
            </span>
        </WrapperTag>
    );
};

export default TextWithTooltip;
