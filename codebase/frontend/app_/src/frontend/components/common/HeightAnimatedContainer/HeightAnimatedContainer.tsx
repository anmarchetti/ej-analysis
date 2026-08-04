import React, { FC, useEffect, useRef, useState } from 'react';
import { Transition } from 'react-transition-group';
import classNames from 'classnames';

import settings from 'code/settings';
import { TransitionAnimationState } from 'models/enum/TransitionAnimationState';

import styles from './HeightAnimatedContainer.module.scss';

export interface IHeightAnimatedContainerProps {
    children?: React.ReactNode;
    containerClasName?: string;
    enter?: boolean;
    exit?: boolean;
    isOpened?: boolean;
    keepMounted?: boolean;
    onEnter?: () => void;
    onEntered?: () => void;
    onExit?: () => void;
    onExited?: () => void;
    timeout?: number;
}

const HeightAnimatedContainer: FC<IHeightAnimatedContainerProps> = ({
    timeout,
    isOpened,
    children,
    enter,
    exit,
    onEnter,
    onEntered,
    onExit,
    onExited,
    containerClasName,
    keepMounted,
}) => {
    const [height, setHeight] = useState<number | undefined>(0);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (ref.current && isOpened) {
            setHeight(ref.current.scrollHeight);
        } else {
            setHeight(0);
        }
    }, []);

    const handleEnter = (): void => {
        if (ref.current) {
            setHeight(ref.current.scrollHeight);
        }

        onEnter?.();
    };

    const handleEntering = (): void => {
        if (ref.current) {
            setHeight(ref.current.scrollHeight);
        }
    };

    const handleEntered = (): void => {
        if (ref.current) {
            setHeight(ref.current.scrollHeight);
        }

        onEntered?.();
    };

    const handleExit = (): void => {
        if (ref.current) {
            setHeight(ref.current.scrollHeight);
        }

        onExit?.();
    };

    const handleExiting = (): void => {
        // Timeout ensures height transition happens smoothly on close.
        setTimeout(() => {
            setHeight(0);
        }, 1);
    };

    //remove global classes when search bar will be refactored and reference to HeightAnimation will be removed
    const getContainerClassName = (state: string): string => {
        const isAnimationInProgress =
            state === TransitionAnimationState.Entering || state === TransitionAnimationState.Exiting;

        return classNames(
            'animation--height',
            styles.container,
            {
                'animation--in-progress': isAnimationInProgress,
                [styles.inProgress]: isAnimationInProgress,
                [styles.overflowHidden]: !height,
            },
            containerClasName,
        );
    };

    const getStyles = (state: string): React.CSSProperties | undefined => {
        if (height === undefined || state === TransitionAnimationState.Entered) {
            return {};
        }

        return { height };
    };

    return (
        <Transition
            in={isOpened}
            timeout={timeout || settings.Animation.DurationMs}
            enter={enter}
            exit={exit}
            onEnter={handleEnter}
            onEntering={handleEntering}
            onEntered={handleEntered}
            onExit={handleExit}
            onExiting={handleExiting}
            onExited={onExited}
            mountOnEnter={!keepMounted}
            unmountOnExit={!keepMounted}
        >
            {(transitionState: string): JSX.Element => (
                <div
                    ref={ref}
                    className={getContainerClassName(transitionState)}
                    style={getStyles(transitionState)}
                    data-tid='animated-container'
                >
                    {children}
                </div>
            )}
        </Transition>
    );
};

export default HeightAnimatedContainer;
