import { useState } from 'react';
import classNames from 'classnames';

import AnimatedWrapper from 'frontend/components/common/AnimatedWrapper/AnimatedWrapper';

import GuestDetailsHeader from './GuestDetailsHeader';

import styles from './GuestDetailsBlock.module.scss';

interface IGuestDetailsBlockProps {
    icon: JSX.Element;
    title: string;
    children?: React.ReactNode;
    disabled?: boolean;
    id?: string;
    ignoreAnimation?: boolean;
    isLead?: boolean;
    secondaryText?: string;
    wrapperClassName?: string;
}

const GuestDetailsBlock: React.FC<IGuestDetailsBlockProps> = ({
    id,
    title,
    secondaryText,
    icon,
    children,
    disabled = false,
    ignoreAnimation = false,
    wrapperClassName,
    isLead = false,
}) => {
    const [isExpanded, setIsExpanded] = useState<null | boolean>(null);

    // We should separate the initial render with
    // special conditions from the normal click-based flow.
    //
    // For null (i.e., the default value hasn’t changed),
    // we use the initial render without animation.
    //
    // For a lead, the default view is expanded;
    // for others, it is collapsed.
    //
    // Once value is boolean, it means the user has clicked.
    const isShown = isExpanded === null ? isLead : isExpanded;

    return (
        <div
            id={id}
            className={classNames(styles.wrapper, wrapperClassName, {
                [styles.disabled]: disabled,
                [styles.ignoreAnimation]: ignoreAnimation || isExpanded === null,
            })}
            data-cs-mask
            data-status={isShown ? 'expanded' : 'collapsed'}
        >
            <GuestDetailsHeader
                title={title}
                secondaryText={secondaryText}
                icon={icon}
                isExpanded={isShown}
                onClick={(): void => setIsExpanded(!isShown)}
                disabled={disabled}
            />

            {!disabled && (
                <AnimatedWrapper
                    keepMounted
                    isShown={isShown}
                    wrapperClass={styles.closed}
                    entranceClass={styles.open}
                    exitClass=''
                >
                    {children}
                </AnimatedWrapper>
            )}
        </div>
    );
};

export default GuestDetailsBlock;
