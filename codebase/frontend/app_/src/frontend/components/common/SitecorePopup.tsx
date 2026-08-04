import React, { Component, ReactNode } from 'react';
import { inject } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { TStores } from 'frontend/store/IStores';

import { Popup } from './Popup';

interface ISitecorePopupProps {
    itemId: string; // item id to show inside popup
    lang: string;
    onClose: () => void;
}

interface ISitecorePopupState {
    hasLoaded: boolean;
}

/** Shows Sitecore edit window inside popup */
export class SitecorePopup extends Component<ISitecorePopupProps, ISitecorePopupState> {
    state = {
        hasLoaded: false,
    };

    private popupRef = React.createRef<HTMLDivElement>();

    componentDidMount(): void {
        // addEventListener because Sitecore ignores React events
        [
            this.popupRef.current?.querySelector('.sitecore-popup .popup__close'),
            this.popupRef.current?.querySelector('.sitecore-popup .close-popup-btn'),
        ].forEach(e => {
            e?.addEventListener('click', this.props.onClose);
        });
    }

    componentWillUnmount(): void {
        [
            this.popupRef.current?.querySelector('.sitecore-popup .popup__close'),
            this.popupRef.current?.querySelector('.sitecore-popup .close-popup-btn'),
        ].forEach(e => {
            e?.removeEventListener('click', this.props.onClose);
        });
    }

    private onIframeLoad = () => {
        this.setState({ hasLoaded: true });
    };

    render(): ReactNode {
        return (
            <Popup
                containerClass='sitecore-popup'
                showCloseButton
                onClose={this.props.onClose}
                footerContent={<button className='btn close-popup-btn'>Close</button>}
                popupRef={this.popupRef}
            >
                {!this.state.hasLoaded && <div>Loading...</div>}
                <iframe
                    className={this.state.hasLoaded ? '' : 'd-none'}
                    src={cmsUrls.itemPopup(this.props.itemId, this.props.lang)}
                    onLoad={this.onIframeLoad}
                />
            </Popup>
        );
    }
}

export default inject((stores: TStores) => ({
    lang: stores.layoutStore.lang,
    onClose: stores.editorStore.onCloseSitecorePopup,
}))(SitecorePopup);
