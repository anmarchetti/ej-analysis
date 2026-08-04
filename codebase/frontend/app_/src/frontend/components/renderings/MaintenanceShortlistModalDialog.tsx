import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import ModalDialog from 'frontend/components/renderings/ModalDialog';

interface IMaintenanceShortlistModalDialogFields {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

export type TMaintenanceShortlistModalDialogProps = ISitecoreComponent<IMaintenanceShortlistModalDialogFields>;

export const MaintenanceShortlistModalDialog: FC<TMaintenanceShortlistModalDialogProps> = props => {
    const { isFullMaintenance, isShowLoginPopup, toggleShowLoginPopup } = useStore((stores: IHolidaysStores) => ({
        isFullMaintenance: stores.layoutStore.isFullMaintenance,
        isShowLoginPopup: stores.shortlistStore.isShowLoginPopup,
        toggleShowLoginPopup: stores.shortlistStore.toggleShowLoginPopup,
    }));

    return isFullMaintenance ? (
        <ModalDialog
            isShowPopup={isShowLoginPopup}
            onClose={(): void => toggleShowLoginPopup(false)}
            fields={props.fields}
            params={props.params}
            rendering={props.rendering}
        />
    ) : null;
};

export default observer(MaintenanceShortlistModalDialog);
