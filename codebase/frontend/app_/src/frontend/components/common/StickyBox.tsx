import * as React from 'react';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { debounce } from 'frontend/utils/debounce';

export interface IStickyBoxProps {
    isBodyScrollLocked: boolean;
    render: (heightUpdated, params: Record<string, any>) => React.ReactNode;
    className?: string;
    dynamicHeight?: boolean;

    offsetCompensation?: number;
    stickyMobile?: boolean;
}

interface IStickyBoxState {
    isSticky: boolean;
    stickyHeight: number;
}

export const STICKY_BOX_ID = 'sticky-box';

export class StickyBox extends React.Component<IStickyBoxProps, IStickyBoxState> {
    private debounceDelay = 10;
    private stickyBox;
    private stickyHeight = 0;
    private stickyOffset = 0;

    state = {
        isSticky: false,
        stickyHeight: 0,
    };

    componentDidMount(): void {
        if (this.stickyBox) {
            // just to make test work
            this.stickyOffset = this.stickyBox.offsetTop + (this.props.offsetCompensation || 0);
        }

        document.addEventListener('scroll', this.debouncedStickyHandler);
        this.stickyHandler();
    }

    componentWillUnmount(): void {
        document.removeEventListener('scroll', this.debouncedStickyHandler);
    }

    private get gapStyles(): React.CSSProperties {
        return this.state.isSticky
            ? {
                  height: this.stickyHeight + (this.props.offsetCompensation || 0),
              }
            : {};
    }

    private get stickyBoxClassNames() {
        return classNames(
            'sticky-box',
            this.props.stickyMobile && 'sticky-mobile',
            this.state.isSticky && 'sticky',
            this.props.className,
        );
    }

    private stickyHandler = () => {
        if (!this.stickyBox || this.props.isBodyScrollLocked) {
            return;
        }

        if (!this.state.isSticky) {
            this.stickyOffset = this.stickyBox.offsetTop + (this.props.offsetCompensation || 0);
        }

        this.stickyHeight =
            this.stickyBox.getBoundingClientRect().height -
            (!this.state.isSticky && this.props.offsetCompensation ? this.props.offsetCompensation : 0);

        // If the sticky box is hidden (e.g. because of A/B testing) we don't want it to be sticky
        const isStickyBoxHidden = this.stickyBox.offsetParent === null;
        const newState = {
            isSticky: !isStickyBoxHidden && window.pageYOffset >= this.stickyOffset,
            stickyHeight: this.stickyHeight,
        };

        if (
            newState.isSticky !== this.state.isSticky ||
            (this.props.dynamicHeight && newState.stickyHeight !== this.state.stickyHeight)
        ) {
            this.setState({
                isSticky: window.pageYOffset >= this.stickyOffset,
                stickyHeight: this.stickyHeight,
            });
        }
    };

    heightUpdated = (): void => {
        this.debouncedStickyHandler();
    };

    debouncedStickyHandler = debounce(this.stickyHandler, this.debounceDelay);

    render(): React.ReactNode {
        return (
            <div className='sticky-wr' data-tid='sticky-box'>
                <div
                    className={this.stickyBoxClassNames}
                    id={STICKY_BOX_ID}
                    ref={element => {
                        this.stickyBox = element;
                    }}
                >
                    {this.props.render(this.heightUpdated, { isSticky: this.state.isSticky })}
                </div>
                <div className='sticky-gap' id='sticky-gap' style={this.gapStyles} />
            </div>
        );
    }
}

export default inject((stores: TStores) => ({
    isBodyScrollLocked: stores.layoutStore.isBodyScrollLocked,
}))(observer(class WrappedStickyBox extends StickyBox {}));
