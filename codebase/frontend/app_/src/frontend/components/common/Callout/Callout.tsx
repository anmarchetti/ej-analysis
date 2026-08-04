import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';

import { CalloutContainer } from './components/CalloutContainer/CalloutContainer';
import CalloutDrawer from './components/CalloutDrawer/CalloutDrawer';

import styles from './Callout.module.scss';

export interface ICalloutProps {
    content: JSX.Element | null;
    orientation: CalloutOrientation;
    position: CalloutPosition;
    calculateWidth?: boolean;
    children?: React.ReactNode;
    className?: string;
    drawerTitle?: ISitecoreField<string>;
    drawerTitleClassName?: string;
    enablePrintMode?: boolean;
    footerClassName?: string;
    handleCalloutHoverState?: (state: boolean) => void;
    isCTAOutlined?: boolean;
    isCloseWhenClickOnContent?: boolean;
    isDrawerVariant?: boolean;
    isIconSmall?: boolean;
    isShownOnHover?: boolean;
}

export const Callout: FC<ICalloutProps> = props => {
    const { getPhrase } = useStore((stores: TStores) => ({ getPhrase: stores.layoutStore.getPhrase }));
    const containerNode = useRef<HTMLDivElement>(null);
    const {
        handleCalloutHoverState,
        isDrawerVariant,
        drawerTitle,
        className,
        isShownOnHover,
        isIconSmall,
        orientation,
        position,
        content,
        children,
        calculateWidth,
        isCloseWhenClickOnContent,
        drawerTitleClassName,
        isCTAOutlined,
        footerClassName,
        enablePrintMode,
    } = props;

    const [state, setState] = useState({
        isVisible: false,
        isFocused: false,
    });

    const isMobile = useMobileViewport();

    const setIsFocused = (state: boolean) => () => {
        setState(prev => ({ ...prev, isFocused: state }));
    };

    const preventSpaceWindowClick = useCallback(e => {
        // To prevent page scroll when "space" hit
        if (e.code === 'Space') {
            e.preventDefault();
        }
    }, []);

    useEffect(() => {
        if (state.isFocused) {
            window.addEventListener('keypress', preventSpaceWindowClick);
        } else {
            window.removeEventListener('keypress', preventSpaceWindowClick);
        }

        return () => {
            window.removeEventListener('keypress', preventSpaceWindowClick);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.isFocused]);

    const { clickHandlers, hoverHandlers } = useMemo(() => {
        const onClose = () => {
            setState({ isVisible: false, isFocused: false });
            handleCalloutHoverState?.(false);
        };
        const onOpen = () => {
            setState(prev => ({ ...prev, isVisible: true }));
            handleCalloutHoverState?.(true);
        };
        const onKeyDown = (e): void => {
            if (e.code !== 'Enter' && e.code !== 'Space') {
                return;
            }

            setState(prev => ({ ...prev, isVisible: !prev.isVisible }));
            handleCalloutHoverState?.(state.isVisible);
        };

        const hoverHandlers = {
            onMouseLeave: onClose,
            onMouseOver: onOpen,
            onBlur: onClose,
            onClose,
            onKeyDown,
        };
        const clickHandlers = {
            onMouseLeave: undefined,
            onClick: (e): void => {
                e.preventDefault();
                e?.stopPropagation();

                setState(prevState => {
                    const newVisibility = !prevState.isVisible;

                    handleCalloutHoverState?.(newVisibility);

                    return { ...prevState, isVisible: newVisibility };
                });
            },
            onClose,
            onKeyDown,
        };

        return { clickHandlers, hoverHandlers };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isOnHoverBehavior = isShownOnHover && !isMobile;
    const handlers = isOnHoverBehavior ? hoverHandlers : clickHandlers;

    return (
        <div
            ref={containerNode}
            className={classNames('callout__container', !enablePrintMode && 'no-print', className, {
                [styles.smallIcon]: isIconSmall,
            })}
            data-tid='callout-wrapper'
        >
            <button
                data-tid='callout-parent'
                className={classNames('callout__parent', styles.iconWrapper, { 'tooltip-visible': state.isVisible })}
                onFocus={setIsFocused(true)}
                aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsTooltipTrigger)}
                {...handlers}
            >
                {children ?? (
                    <i className='more-info'>
                        <IconInfoCircle />
                    </i>
                )}
            </button>

            {state.isVisible &&
                (isDrawerVariant && drawerTitle ? (
                    <CalloutDrawer
                        onClose={handlers.onClose}
                        title={drawerTitle}
                        titleClassName={drawerTitleClassName}
                        isCTAOutlined={isCTAOutlined}
                        footerClassName={footerClassName}
                    >
                        {content}
                    </CalloutDrawer>
                ) : (
                    <CalloutContainer
                        containerClass={classNames('callout__content', orientation, position)}
                        containerRef={containerNode}
                        onClose={handlers.onClose}
                        calculateWidth={calculateWidth}
                        isCloseWhenClickOnContent={isCloseWhenClickOnContent}
                    >
                        {content}
                    </CalloutContainer>
                ))}
        </div>
    );
};

export default Callout;
