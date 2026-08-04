import { FC } from 'react';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ActionPopup from 'frontend/components/common/ActionPopup';

export interface ICancellationPopUpProps {
    CancellationPopUpBackButton: ISitecoreField<string>;
    CancellationPopUpContinueButton: ISitecoreField<string>;
    CancellationPopUpDescription: ISitecoreField<string>;
    CancellationPopUpTitle: ISitecoreField<string>;
    onSeatMapClose: () => void;
    setIsCancelPopupOpened: (prop: boolean) => void;
}

export const CancellationPopUp: FC<ICancellationPopUpProps> = ({
    CancellationPopUpTitle,
    CancellationPopUpDescription,
    CancellationPopUpContinueButton,
    CancellationPopUpBackButton,
    setIsCancelPopupOpened,
    onSeatMapClose,
}) => {
    const onContinueClick = (): void => {
        setIsCancelPopupOpened(false);
    };

    const onCloseClick = (): void => {
        setIsCancelPopupOpened(false);
        onSeatMapClose();
    };

    return (
        <ActionPopup
            title={CancellationPopUpTitle?.value}
            subtitle={CancellationPopUpDescription?.value}
            continueLabel={CancellationPopUpBackButton?.value}
            cancelLabel={CancellationPopUpContinueButton?.value}
            onContinue={onCloseClick}
            onCancel={onContinueClick}
            isInnerPopup
        />
    );
};
export default CancellationPopUp;
