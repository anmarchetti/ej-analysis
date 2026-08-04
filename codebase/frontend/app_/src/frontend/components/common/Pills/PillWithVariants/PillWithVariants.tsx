import { FC } from 'react';
import classNames from 'classnames';

import Pill from 'frontend/components/common/Pills/Pill/Pill';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';

import { PillSizeVariants } from './PillSizeVariants';

import styles from './PillWithVariants.module.scss';

interface IPillContent {
    icon: JSX.Element;
    text: string;
    tooltipMessage: string;
}

interface IPillWithVariantsProps {
    content: IPillContent;
    dataIdPrefix: string;
    pillClass?: string;
    pillSize?: PillSizeVariants;
    tooltipClass?: string;
}

export const PillWithVariants: FC<IPillWithVariantsProps> = ({
    content,
    dataIdPrefix,
    pillSize,
    pillClass,
    tooltipClass,
}) => {
    if (pillSize) {
        return (
            <div
                data-tid={`${dataIdPrefix}-pill-wrapper`}
                className={classNames(
                    styles.wrapper,
                    styles.pillShape,
                    {
                        [styles.bigWrapper]: pillSize === PillSizeVariants.Big,
                        [styles.smallWrapper]: pillSize === PillSizeVariants.Small,
                    },
                    pillClass,
                )}
            >
                <Tooltip>
                    <TooltipTrigger>
                        <button className={styles.pillIcon} aria-label='pill-icon'>
                            {content.icon}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent text={content.tooltipMessage} />
                </Tooltip>

                <span data-tid={`${dataIdPrefix}-pill-text`} className={styles.text}>
                    {content.text}
                </span>
            </div>
        );
    }

    return (
        <Pill
            ellipsis
            contentClass={pillClass}
            icon={content.icon}
            title={content.text}
            text={content.tooltipMessage}
            dataTid={`${dataIdPrefix}-pill`}
            tooltipClass={tooltipClass}
        />
    );
};

export default PillWithVariants;
