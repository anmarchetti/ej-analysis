import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getNoTransfer } from 'frontend/utils/transfer.utils';
import { IHoldLuggageInfo } from 'models/data/IHoldLuggage';
import { ISEAccommodationFailPopupFields, ITransferFields } from 'frontend/components/renderings/Transfer/Transfer';

export default function useSEAccommodationFail(
    selectedLuggageFromStore: IHoldLuggageInfo,
    selectedSportEquipmentFromStore: IHoldLuggageInfo,
    clearHoldLuggage: () => void,
    setSportEquipment: (a: IHoldLuggageInfo) => void,
    additionalFields?: ITransferFields,
): Nullable<[ISEAccommodationFailPopupFields, () => void, () => void]> {
    const {
        isTransferNotAccommodatingSE,
        isTransferRemoveSE,
        isSERemoveTransfer,
        isTransferRemoveLargeSE,
        isLargeSERemoveTransfer,
        alternativeTransfers,
        transferCandidate,
        prevTransfer,
        largeSportEquipmentList,
        sportEquipmentPossibleToTransfer,
        clearSEAccommodationFails,
        changeTransfer,
        setTransferCandidate,
        setPrevTransfer,
        confirmExtraLuggage,
        actualizeLuggageParams,
    } = useStore(({ bookingStore }: TStores) => ({
        isTransferNotAccommodatingSE: bookingStore.isTransferNotAccommodatingSE,
        isTransferRemoveSE: bookingStore.isTransferRemoveSE,
        isSERemoveTransfer: bookingStore.isSERemoveTransfer,
        isTransferRemoveLargeSE: bookingStore.isTransferRemoveLargeSE,
        isLargeSERemoveTransfer: bookingStore.isLargeSERemoveTransfer,
        alternativeTransfers: bookingStore.alternativeTransfers,
        transferCandidate: bookingStore.transferCandidate,
        prevTransfer: bookingStore.prevTransfer,
        largeSportEquipmentList: bookingStore.extraLuggage.largeSportEquipmentList,
        sportEquipmentPossibleToTransfer: bookingStore.extraLuggage.sportEquipmentPossibleToTransfer,
        clearSEAccommodationFails: bookingStore.clearSEAccommodationFails,
        changeTransfer: bookingStore.changeTransfer,
        setTransferCandidate: bookingStore.setTransferCandidate,
        setPrevTransfer: bookingStore.setPrevTransfer,
        confirmExtraLuggage: bookingStore.extraLuggage.confirmExtraLuggage,
        actualizeLuggageParams: bookingStore.extraLuggage.actualizeLuggageParams,
    }));

    if (
        !additionalFields ||
        (!isTransferNotAccommodatingSE &&
            !isTransferRemoveSE &&
            !isSERemoveTransfer &&
            !isTransferRemoveLargeSE &&
            !isLargeSERemoveTransfer)
    ) {
        return null;
    }

    let popupFields;

    if (isTransferNotAccommodatingSE) {
        popupFields = additionalFields.TransferNotAccommodatingSEPopup;
    } else if (isTransferRemoveSE) {
        popupFields = additionalFields.TransferRemoveSEPopup;
    } else if (isSERemoveTransfer) {
        popupFields = additionalFields.SERemoveTransferPopup;
    } else if (isTransferRemoveLargeSE) {
        popupFields = additionalFields.TransferRemoveLargeSEPopup;
    } else if (isLargeSERemoveTransfer) {
        popupFields = additionalFields.LargeSERemoveTransferPopup;
    }

    if (!popupFields?.fields) {
        return null;
    }

    if (isTransferRemoveLargeSE || isLargeSERemoveTransfer) {
        const description = Tokenizer.replaceToken(
            popupFields.fields.Description.value,
            Tokens.SelectedSport,
            largeSportEquipmentList,
        );

        popupFields = { fields: { ...popupFields.fields, Description: { value: description } } };
    }

    const onContinueClick = async () => {
        clearSEAccommodationFails();

        if (isTransferRemoveSE || isTransferRemoveLargeSE) {
            setSportEquipment(sportEquipmentPossibleToTransfer);

            // continue with transfer and remove sport equipment
            if (transferCandidate) {
                await actualizeLuggageParams(selectedLuggageFromStore, sportEquipmentPossibleToTransfer);
                changeTransfer();
            } else {
                setPrevTransfer(null);
                confirmExtraLuggage(selectedLuggageFromStore, sportEquipmentPossibleToTransfer, clearHoldLuggage);
            }
        } else {
            // continue with sport equipment and remove transfer
            await actualizeLuggageParams(selectedLuggageFromStore, selectedSportEquipmentFromStore);
            changeTransfer(getNoTransfer(alternativeTransfers));
        }
    };

    const onCancelClick = async () => {
        clearSEAccommodationFails();

        if (isTransferRemoveSE || isTransferRemoveLargeSE) {
            // cancel adding transfer and save selected sport equipment
            transferCandidate
                ? setTransferCandidate(null)
                : await changeTransfer(prevTransfer || getNoTransfer(alternativeTransfers));

            prevTransfer && setPrevTransfer(null);
        } else {
            // cancel adding sport equipment and save selected transfer (but we still need to add hold luggage if it was added in popup)
            setSportEquipment(sportEquipmentPossibleToTransfer);
            confirmExtraLuggage(selectedLuggageFromStore, sportEquipmentPossibleToTransfer, clearHoldLuggage);
        }
    };

    return [popupFields.fields, onContinueClick, onCancelClick];
}
