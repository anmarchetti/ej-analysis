import * as React from 'react';
import classNames from 'classnames';
import FocusTrap from 'focus-trap-react';
import { inject, observer } from 'mobx-react';

import settings from 'code/settings';
import { TStores } from 'frontend/store/IStores';
import { lockBodyScroll, prepareBodyScrollLock, unLockBodyScroll } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { withRerender } from 'frontend/components/hoc';

interface IDrawerProps extends React.AriaAttributes {
    getPhrase: (key: string) => string;
    isBodyScrollLocked: boolean;
    setIsBodyScrollLocked: (isBodyScrollLocked: boolean) => void;
    children?: any;
    className?: string;
    containerRef?: React.RefObject<HTMLDivElement>;
    dataTid?: string;
    isFocusTrap?: boolean;
    isGreyBackground?: boolean;
    isInDrawer?: boolean;
    open?: boolean;
    scrollableBoxSelector?: string;
}

export class Drawer extends React.Component<IDrawerProps> {
    componentDidMount(): void {
        if (this.props.isInDrawer) {
            return;
        }

        if (this.props.open) {
            this.disableBodyScroll();
        }

        prepareBodyScrollLock();
    }

    componentDidUpdate(prevProps: IDrawerProps): void {
        if (this.props.isInDrawer) {
            return;
        }

        if (!prevProps.open && this.props.open) {
            this.disableBodyScroll();
        }

        if (prevProps.open && !this.props.open) {
            this.enableBodyScroll();
        }
    }

    componentWillUnmount(): void {
        if (this.props.isInDrawer) {
            return;
        }

        if (this.props.open) {
            this.enableBodyScroll();
        }
    }

    disableBodyScroll = (): void => {
        if (!this.props.isBodyScrollLocked) {
            this.props.setIsBodyScrollLocked(true);
            lockBodyScroll();
        }
    };

    enableBodyScroll = (): void => {
        if (this.props.isBodyScrollLocked) {
            unLockBodyScroll();

            setTimeout(() => {
                this.props.setIsBodyScrollLocked(false);
            }, settings.Animation.BodyScrollLockedDelay);
        }
    };

    get className(): string {
        return classNames(
            this.props.className,
            'drawer',
            this.props.open && 'drawer--open',
            this.props.isGreyBackground && 'drawer--grey',
        );
    }

    render(): React.ReactNode {
        const {
            containerRef,
            dataTid,
            open,
            children,
            isFocusTrap,
            'aria-labelledby': ariaLabelledby,
            'aria-label': ariaLabel,
            getPhrase,
        } = this.props;

        const content = (
            <div
                className={this.className}
                ref={containerRef}
                role='dialog'
                aria-modal='true'
                aria-labelledby={ariaLabelledby}
                aria-label={ariaLabel ?? getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPopup)}
                data-tid={dataTid}
                data-drawer-status={open ? 'open' : 'close'}
            >
                {children}
            </div>
        );

        return isFocusTrap ? (
            <FocusTrap
                active={open}
                focusTrapOptions={{
                    clickOutsideDeactivates: true,
                    returnFocusOnDeactivate: false,
                }}
            >
                {content}
            </FocusTrap>
        ) : (
            content
        );
    }
}

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isBodyScrollLocked: stores.layoutStore.isBodyScrollLocked,
    setIsBodyScrollLocked: stores.layoutStore.setIsBodyScrollLocked,
}))(withRerender(observer(class WrappedDrawer extends Drawer {})));
