import { FC } from 'react';

import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';
import AttentionPopup, {
    AttentionPopupMobilePosition,
    IAttentionPopupProps,
} from 'frontend/components/renderings/AttentionPopup/AttentionPopup';

export interface IUnavailableFlowPopupProps extends Omit<IAttentionPopupProps, 'fields' | 'disableOutsideClick'> {
    fields: IUnavailablePopupFields;
}

const UnavailableFlowPopup: FC<IUnavailableFlowPopupProps> = ({ fields, ...popupProps }) => (
    <AttentionPopup
        mobilePosition={AttentionPopupMobilePosition.Center}
        disableOutsideClick
        fields={{
            ...fields,
            SecondaryCTA: fields.NoOptionsCTA,
        }}
        {...popupProps}
    />
);

export default UnavailableFlowPopup;
