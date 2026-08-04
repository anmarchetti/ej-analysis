import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useAnimatedWrapper from './AnimatedWrapper.utils';

import styles from './AnimatedWrapper.module.scss';

interface IAnimatedWrapper {
    children: ReactNode;
    isShown: boolean;
    contentClass?: string;
    disableAnimation?: boolean;
    entranceClass?: string;
    exitClass?: string;
    keepMounted?: boolean;
    onAnimationEnd?: () => void;
    wrapperClass?: string;
}

export const AnimatedWrapper: FC<IAnimatedWrapper> = ({
    isShown,
    wrapperClass = styles.wrapper,
    entranceClass = styles.entrance,
    exitClass = styles.exit,
    contentClass = styles.content,
    children,
    onAnimationEnd: onEnd,
    disableAnimation = false,
    keepMounted = false,
}) => {
    const { render, onAnimationEnd } = useAnimatedWrapper({ isShown, onEnd, disableAnimation });

    if (!render && !keepMounted) return null;

    const entranceExitClass = isShown ? entranceClass : exitClass;
    const animationClass = disableAnimation ? '' : entranceExitClass;

    return (
        <div className={classNames(wrapperClass, animationClass)} onAnimationEnd={onAnimationEnd}>
            <div className={contentClass}>{children}</div>
        </div>
    );
};

export default observer(AnimatedWrapper);
