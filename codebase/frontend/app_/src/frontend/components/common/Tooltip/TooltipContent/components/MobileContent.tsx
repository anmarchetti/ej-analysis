import { forwardRef, ReactNode, RefObject } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { AnimatedWrapper } from 'frontend/components/common/AnimatedWrapper/AnimatedWrapper';
import Button from 'frontend/components/common/Button';

import useMobileContent, { IMobileContent, ITabletContent } from './MobileContent.utils';

import styles from './MobileContent.module.scss';

interface IMobileContentProps {
    children: ReactNode;
    className: string;
    getFloatingProps: () => any;
    isAnimationLaunched: boolean;
    refs: {
        floating: RefObject<HTMLDivElement>;
        reference: RefObject<HTMLDivElement>;
    };
    setIsAnimationLaunched: (v: boolean) => void;
    setOpen: (v: boolean) => void;
    isMobileFullScreenFixed?: boolean;
    isPrimaryCloseButton?: boolean;
}

const MobileContent = forwardRef<HTMLDivElement>(
    (
        {
            children,
            refs,
            getFloatingProps,
            setOpen,
            isAnimationLaunched,
            setIsAnimationLaunched,
            isMobileFullScreenFixed,
            isPrimaryCloseButton,
            className,
        }: IMobileContentProps,
        propRef,
    ) => {
        const {
            onClose,
            isMobile,
            content: contentProps,
            overlay: overlayProps,
            contentRef,
            isOverflow,
        } = useMobileContent({ setOpen, isAnimationLaunched, setIsAnimationLaunched, refs });

        const { getPhrase } = useStore(stores => ({
            getPhrase: stores.layoutStore.getPhrase,
        }));

        const { ref, style, onTransitionEnd, ...handlers } = contentProps as IMobileContent;

        const content = (
            <div
                id='content-wrapper'
                data-tid='tooltip-mobile-content-wrapper'
                className={styles.contentWrapper}
                {...(isMobile ? { ref, style, onTransitionEnd } : {})}
            >
                {isMobile && (
                    <div className={styles.swipe} {...(isMobile ? handlers : {})}>
                        <div className={styles.swipeIndicator} />
                    </div>
                )}

                <div className={styles.content} ref={contentRef}>
                    <div className={styles.childrenWrapper}>{children}</div>
                </div>

                <div
                    className={classNames(styles.btnWrapper, {
                        [styles.shadow]: isOverflow,
                    })}
                >
                    <Button
                        isOutlined={!isPrimaryCloseButton}
                        isPrimary={isPrimaryCloseButton}
                        isFullWidth
                        className={styles.button}
                        onClick={onClose}
                        dataTid='tooltip-mobile-close-button'
                    >
                        {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                    </Button>
                </div>
            </div>
        );

        return (
            /* eslint-disable jsx-a11y/no-static-element-interactions */
            <div
                className={classNames(styles.overlay, className)}
                {...overlayProps}
                data-tid='tooltip-mobile-overlay'
                // Prevent clicks propagating to parent drawers or modals and closing them
                onMouseDown={(e): void => e.stopPropagation()}
            >
                {/* eslint-enable jsx-a11y/no-static-element-interactions */}
                <div className={styles.appleHelperWrapper}>
                    <div className={styles.appleHelperOuter}>
                        <div className={styles.appleHelperInner}>
                            <div
                                ref={propRef}
                                data-tid='tooltip-mobile-wrapper'
                                className={classNames(isMobile ? styles.mobileWrapper : styles.tabletWrapper, {
                                    [styles.fixedHeight]: isMobileFullScreenFixed,
                                })}
                                {...{ ...getFloatingProps(), 'aria-label': 'mobile-tooltip-wrapper' }}
                            >
                                {isMobile && content}

                                {!isMobile && (
                                    <AnimatedWrapper {...(contentProps as ITabletContent)}>{content}</AnimatedWrapper>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

export default observer(MobileContent);
