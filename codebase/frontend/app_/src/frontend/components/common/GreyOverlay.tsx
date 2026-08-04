import React from 'react';
import classNames from 'classnames';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { withRerender } from 'frontend/components/hoc';

interface IGreyOverlayProps {
    isShown: boolean;
    wasMaintenancePopupShown: boolean;
}

export const GreyOverlay = (props: IGreyOverlayProps) =>
    props.isShown ? <div className={classNames('grey-overlay', !props.wasMaintenancePopupShown && 'd-none')} /> : null;

/* istanbul ignore next */
export default inject((stores: TStores) => ({
    isShown: stores.layoutStore.isGreyOverlayShown,
    wasMaintenancePopupShown: stores.appStore.wasMaintenancePopupShown,
}))(withRerender(GreyOverlay));
