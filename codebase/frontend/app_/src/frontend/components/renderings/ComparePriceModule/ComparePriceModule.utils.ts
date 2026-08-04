import { NewOfferState } from 'frontend/store/base';

import { IComparePriceModuleFields } from './components/ComparePriceContent/ComparePriceContent.utils';

export interface IInfoPopupProps {
    fields: IComparePriceModuleFields;
    isLoading: boolean;
    isLoadingError: boolean;
    newOfferState: NewOfferState;
    setIsLoadingError: (value: boolean) => void;
    setNewOfferState: (value: NewOfferState) => void;
}

export const getInfoPopupProps = ({
    fields,
    setNewOfferState,
    newOfferState,
    isLoading,
    isLoadingError,
    setIsLoadingError,
}: IInfoPopupProps) => {
    const {
        ConfirmationPopupSubtitle,
        ConfirmationPopupTitle,
        ConfirmationPopupIcon,
        ErrorPopupSubtitle,
        ErrorPopupTitle,
        ErrorPopupIcon,
        LoadingErrorPopupSubtitle,
        LoadingErrorPopupTitle,
    } = fields;

    const data = {
        onClose: (): void => setIsLoadingError(false),
        shouldShow: false,
        type: 'error',
        subtitle: LoadingErrorPopupSubtitle,
        title: LoadingErrorPopupTitle,
        icon: ErrorPopupIcon,
        isSmall: true,
    };

    if (!isLoading && newOfferState === NewOfferState.Accepted) {
        return {
            onClose: (): void => setNewOfferState(NewOfferState.NoChange),
            shouldShow: true,
            type: 'confirm',
            subtitle: ConfirmationPopupSubtitle,
            title: ConfirmationPopupTitle,
            icon: ConfirmationPopupIcon,
        };
    }

    if (!isLoading && newOfferState === NewOfferState.Error) {
        return {
            onClose: (): void => setNewOfferState(NewOfferState.NoChange),
            shouldShow: true,
            type: 'error',
            subtitle: ErrorPopupSubtitle,
            title: ErrorPopupTitle,
            icon: ErrorPopupIcon,
            isSmall: true,
        };
    }

    if (isLoadingError) {
        return {
            ...data,
            shouldShow: true,
        };
    }

    return data;
};
