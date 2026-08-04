import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { JSSImage } from 'frontend/components/common/JSSImage';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface IModalDialogFields {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

interface IModalDialogProps extends ISitecoreComponent<IModalDialogFields> {
    isShowPopup: boolean;
    onClose: () => void;
}

export const ModalDialog: React.FunctionComponent<IModalDialogProps> = props => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return props.isShowPopup ? (
        <Popup
            containerClass='modal-dialog'
            footerContent={<Button onClick={props.onClose}>{getPhrase(SitecoreDictionary.GlobalsButtonsClose)}</Button>}
        >
            {!!props.fields && (
                <div className='content'>
                    {!!props.fields.Icon && <JSSImage field={props.fields.Icon} />}
                    {!!props.fields.Title && <Text field={props.fields.Title} className='content__title' tag='p' />}
                    {!!props.fields.Description && (
                        <RichTextWithLinks field={props.fields.Description} className='content__description' tag='p' />
                    )}
                </div>
            )}
        </Popup>
    ) : null;
};

export default ModalDialog;
