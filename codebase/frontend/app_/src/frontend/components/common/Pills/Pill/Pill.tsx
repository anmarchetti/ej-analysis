import { FC } from 'react';
import classNames from 'classnames';

import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';

import PillContent from './PillContent';

import styles from './Pill.module.scss';

interface IPillProps {
    contentClass?: string;
    dataTid?: string;
    ellipsis?: boolean;
    icon?: JSX.Element;
    iconClass?: string;
    onClick?: () => void;
    onMouseEnter?: () => void;
    text?: string;
    title?: string;
    titleClass?: string;
    tooltipClass?: string;
}

const Pill: FC<IPillProps> = ({ text, ellipsis = false, onClick, onMouseEnter, tooltipClass, ...props }) => {
    if (!text) return <PillContent dotted={false} ellipsis={ellipsis} {...props} />;

    return (
        <Tooltip>
            <TooltipTrigger>
                <button
                    className={classNames(styles.wrapper, styles.pointer)}
                    onClick={onClick}
                    onMouseEnter={onMouseEnter}
                >
                    <PillContent dotted ellipsis={ellipsis} {...props} />
                </button>
            </TooltipTrigger>

            <TooltipContent text={text} className={tooltipClass} />
        </Tooltip>
    );
};

export default Pill;
