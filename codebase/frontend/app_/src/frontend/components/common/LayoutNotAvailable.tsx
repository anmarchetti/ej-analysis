import * as React from 'react';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

export interface ILayoutNotAvailableProps extends IComponentWithDictionary {
    isEditMode: boolean;
    isLayoutError: boolean;
    redirectToHomePage: () => void;
    resetLayoutError: () => void;
}

export class LayoutNotAvailable extends React.Component<ILayoutNotAvailableProps> {
    private onClick = () => {
        this.props.resetLayoutError();
        this.props.redirectToHomePage();
    };

    render() {
        const { isEditMode, isLayoutError, getPhrase } = this.props;

        if (isEditMode || !isLayoutError) {
            return null;
        }

        return (
            <Popup
                title={getPhrase(SitecoreDictionary.LayoutUnavailablePopupLabelsTitle)}
                data-tid='layout-not-available-popup'
            >
                <>
                    <div className='additional-text' data-tid='additional-text'>
                        {getPhrase(SitecoreDictionary.LayoutUnavailablePopupLabelsContent)}
                    </div>
                    <Button onClick={this.onClick}>
                        {getPhrase(SitecoreDictionary.LayoutUnavailablePopupButtonsGoHome)}
                    </Button>
                </>
            </Popup>
        );
    }
}

export default inject((stores: TStores) => ({
    isEditMode: stores.layoutStore.isEditMode,
    getPhrase: stores.layoutStore.getPhrase,
    isLayoutError: stores.layoutStore.isLayoutError,
    resetLayoutError: stores.layoutStore.resetLayoutError,
    redirectToHomePage: stores.routerStore.redirectToHomePage,
}))(observer(LayoutNotAvailable));
