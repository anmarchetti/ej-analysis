import { FC } from 'react';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';

import { Popup } from './Popup';

interface INetworkIssuesPopupProps extends IComponentWithDictionary {
    isEditMode: boolean;
    isNetworkPopupShown: boolean;
}

export const NetworkIssuesPopup: FC<INetworkIssuesPopupProps> = props => {
    if (!props.isNetworkPopupShown || props.isEditMode) {
        return null;
    }

    return (
        <Popup title={props.getPhrase(SitecoreDictionary.ConnectivityIssuesLabelsTitle)}>
            {props.getPhrase(SitecoreDictionary.ConnectivityIssuesLabelsContent)}
        </Popup>
    );
};

const ConnectedNetworkIssuesPopup = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isNetworkPopupShown: stores.appStore.isNetworkPopupShown,
    isEditMode: stores.layoutStore.isEditMode,
}))(NetworkIssuesPopup);

export default ConnectedNetworkIssuesPopup;
