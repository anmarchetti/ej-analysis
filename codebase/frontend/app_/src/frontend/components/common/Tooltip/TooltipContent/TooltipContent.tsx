import { FC, forwardRef, HTMLProps, PropsWithChildren } from 'react';
import { FloatingArrow, FloatingPortal, useMergeRefs } from '@floating-ui/react';
import classNames from 'classnames';

import { useMoreThenDesktopViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import { RichTextWithLinks } from 'frontend/components/common/RichTextWithLinks';
import { useTooltipContext } from 'frontend/components/common/Tooltip/Tooltip.utils';

import MobileContent from './components/MobileContent';

import styles from './TooltipContent.module.scss';

interface IDefaultContentProps {
    icon?: string;
    name?: string;
    text?: string;
}

interface IExtendedTooltipContentProps extends IDefaultContentProps {
    isMobileFullScreenFixed?: boolean;
    isPrimaryCloseButton?: boolean;
}

type TTooltipContentProps = IExtendedTooltipContentProps & PropsWithChildren<HTMLProps<HTMLElement>>;

const DefaultContent: FC<IDefaultContentProps> = ({ icon, name, text }) => (
    <>
        {!!icon && <JSSImageNext field={{ value: { src: icon, width: 24, height: 24 } }} alt={name} />}

        {!!text && <RichTextWithLinks field={{ value: text }} />}
    </>
);

const TooltipContent = forwardRef<HTMLDivElement, TTooltipContentProps>(
    ({ children, icon, name, text, className, isMobileFullScreenFixed, isPrimaryCloseButton }, propRef) => {
        const {
            refs,
            open: isDisplayed,
            floatingStyles: style,
            getFloatingProps,
            setOpen,
            arrowRef,
            context,
            isAnimationLaunched,
            setIsAnimationLaunched,
            tooltipId,
        } = useTooltipContext();

        const { isMapModalDisplayed, isTooltipIconDisabled } = useStore(stores => ({
            isMapModalDisplayed: stores.searchFiltersStore.isMapModalDisplayed,
            isTooltipIconDisabled: stores.layoutStore.isTooltipIconDisabled,
        }));

        const ref = useMergeRefs([refs.setFloating, propRef]);
        const isDesktop = useMoreThenDesktopViewport();

        const content = children ?? <DefaultContent {...{ icon: isTooltipIconDisabled ? '' : icon, name, text }} />;

        if (!isDisplayed) return null;

        return (
            <FloatingPortal>
                {isDesktop && (
                    <div
                        data-tid='tooltip-desktop-content-wrapper'
                        className={classNames(styles.desktopWrapper, className, {
                            [styles.inPopupWrapper]: isMapModalDisplayed,
                        })}
                        {...{
                            ref,
                            style,
                            ...getFloatingProps(),
                            id: tooltipId,
                        }}
                    >
                        {content}
                        <FloatingArrow className={styles.arrow} ref={arrowRef} context={context} />
                    </div>
                )}

                {!isDesktop && (
                    <MobileContent
                        {...{
                            ref,
                            refs,
                            getFloatingProps,
                            setOpen,
                            isAnimationLaunched,
                            setIsAnimationLaunched,
                            isMobileFullScreenFixed,
                            isPrimaryCloseButton,
                        }}
                    >
                        {content}
                    </MobileContent>
                )}
            </FloatingPortal>
        );
    },
);

export default TooltipContent;
