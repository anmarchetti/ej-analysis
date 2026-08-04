import { FC, useState } from 'react';
import classNames from 'classnames';

import AnimatedWrapper from 'frontend/components/common/AnimatedWrapper/AnimatedWrapper';
import Button from 'frontend/components/common/Button';
import SvgArrow from 'frontend/components/icons-new/Arrow';

import styles from './AnimatedAccordion.module.scss';

export interface IAnimatedAccordionProps {
    buttonContent: JSX.Element;
    children: JSX.Element;
    buttonClass?: string;
    onClick?: () => void;
    openedWrapperClass?: string;
    wrapperClass?: string;
}

const AnimatedAccordion: FC<IAnimatedAccordionProps> = ({
    buttonContent,
    children,
    buttonClass,
    wrapperClass,
    openedWrapperClass = '',
    onClick,
}) => {
    const [isOpened, setIsOpened] = useState(false);
    const onTitleClick = (): void => {
        setIsOpened(prevState => !prevState);
        onClick?.();
    };

    return (
        <div data-tid='animated-accordion' className={classNames(wrapperClass, { [openedWrapperClass]: isOpened })}>
            <Button onClick={onTitleClick} className={buttonClass} isText>
                {buttonContent}
                <SvgArrow className={isOpened ? styles.arrowUp : styles.arrowDown} />
            </Button>

            <AnimatedWrapper entranceClass={styles.open} exitClass={styles.close} isShown={isOpened}>
                {children}
            </AnimatedWrapper>
        </div>
    );
};

export default AnimatedAccordion;
