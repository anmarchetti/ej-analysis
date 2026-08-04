import React, { useState } from 'react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import JSSImage from 'frontend/components/common/JSSImage';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgExternalLink from 'frontend/components/icons-new/ExternalLink';

export interface ITransferInstructionsFields {
    CTA: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    PopupArrivalInstructionTitle: ISitecoreField<string>;
    PopupDepartureInstructionTitle: ISitecoreField<string>;
    PopupDescription: ISitecoreField<string>;
    PopupTitle: ISitecoreField<string>;
}

interface ITransferInstructionsProps extends ISitecoreComponent<ITransferInstructionsFields> {
    arrivalInstruction: string;
    departureInstruction: string;
}

const TransferInstructions = ({ fields, departureInstruction, arrivalInstruction }: ITransferInstructionsProps) => {
    const [isPopupShown, setPopupShown] = useState(false);
    const { getPhrase, isScreenMedium, isTransferInstructionsEnabled } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenMedium: stores.appStore.isScreenMedium,
        isTransferInstructionsEnabled: stores.layoutStore.isTransferInstructionsEnabled,
    }));

    if (!fields || !isTransferInstructionsEnabled || (!departureInstruction && !arrivalInstruction)) {
        return null;
    }

    const renderPopupContent = () => (
        <div>
            <JSSImage field={fields.Icon} className='instructions-popup__icon' />
            {fields.PopupTitle?.value && <h3 className='instructions-popup__title'>{fields.PopupTitle.value}</h3>}
            {fields.PopupDescription?.value && (
                <p className='instructions-popup__text'>{fields.PopupDescription.value}</p>
            )}
            {fields.PopupArrivalInstructionTitle?.value && arrivalInstruction && (
                <h4 className='instructions-popup__instruction-title'>{fields.PopupArrivalInstructionTitle.value}</h4>
            )}
            {arrivalInstruction && (
                <RichTextWithLinks
                    tag='div'
                    field={{ value: arrivalInstruction }}
                    className='instructions-popup__text'
                />
            )}
            {fields.PopupDepartureInstructionTitle?.value && departureInstruction && (
                <h4 className='instructions-popup__instruction-title'>{fields.PopupDepartureInstructionTitle.value}</h4>
            )}
            {departureInstruction && (
                <RichTextWithLinks
                    tag='div'
                    field={{ value: departureInstruction }}
                    className='instructions-popup__text'
                />
            )}
            {isScreenMedium && (
                <Button onClick={() => setPopupShown(false)} className='instructions-popup__btn'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            )}
        </div>
    );

    return (
        <div className='transfer-instructions no-print'>
            {fields.CTA?.value && (
                <Button className='transfer-instructions__cta' isLink onClick={() => setPopupShown(true)}>
                    {fields.CTA?.value}
                    <SvgExternalLink />
                </Button>
            )}
            {isPopupShown && isScreenMedium && (
                <Popup containerClass='instructions-popup' onClose={() => setPopupShown(false)}>
                    {renderPopupContent()}
                </Popup>
            )}
            {
                <Drawer open={isPopupShown && !isScreenMedium} className='instructions-popup'>
                    {renderPopupContent()}
                    <div className='drawer__actions'>
                        <Button onClick={() => setPopupShown(false)} className='instructions-popup__btn'>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                        </Button>
                    </div>
                </Drawer>
            }
        </div>
    );
};

export default TransferInstructions;
