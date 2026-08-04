import { FC } from 'react';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';

import OverlaySpinner from './OverlaySpinner';

interface IPackageValidatingOverlayProps extends IComponentWithDictionary {
    isFullMaintenance: boolean;
    isNavigationBooking: boolean;
    isValidatingPackage: boolean;
}

export const PackageValidatingOverlay: FC<IPackageValidatingOverlayProps> = props =>
    !props.isFullMaintenance && (props.isValidatingPackage || props.isNavigationBooking) ? (
        <OverlaySpinner header={props.getPhrase(SitecoreDictionary.GlobalsLabelsValidatingPackage)} />
    ) : null;

export default inject((stores: TStores) => ({
    isValidatingPackage: stores.bookingStore.isValidatingPackage,
    isNavigationBooking: stores.appStore.isNavigationBooking,
    isFullMaintenance: stores.layoutStore.isFullMaintenance,
    getPhrase: stores.layoutStore.getPhrase,
}))(PackageValidatingOverlay);
