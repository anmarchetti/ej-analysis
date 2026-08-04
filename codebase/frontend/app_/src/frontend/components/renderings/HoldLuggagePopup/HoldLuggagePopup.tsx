import { FC, useEffect } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import FullScreenPopup from 'frontend/components/common/FullScreenPopup/FullScreenPopup';

import HoldLuggageCancelPopup from './components/HoldLuggageCancelPopup/HoldLuggageCancelPopup';
import HoldLuggageInfoLabel from './components/HoldLuggageInfoLabel/HoldLuggageInfoLabel';
import HoldLuggagePopupActions from './components/HoldLuggagePopupActions/HoldLuggagePopupActions';
import HoldLuggagePopupContent from './components/HoldLuggagePopupContent/HoldLuggagePopupContent';

export interface IHoldLuggagePopupFields {
    AdditionalLuggageTitle: ISitecoreField<string>;
    BackButtonCancelPopup: ISitecoreField<string>;
    BackToExtras: ISitecoreField<string>;
    ContinueButtonCancelPopup: ISitecoreField<string>;
    DefaultBagsCounterPlural: ISitecoreField<string>;
    DefaultBagsCounterSingle: ISitecoreField<string>;
    DefaultBagsTitle: ISitecoreField<string>;
    DescriptionHoldLuggage: ISitecoreField<string>;
    DescriptionHoldLuggageAndSport: ISitecoreField<string>;
    DescriptionNote: ISitecoreField<string>;
    DescriptionSport: ISitecoreField<string>;
    Header: ISitecoreField<string>;
    HideAdditionalEquipment: ISitecoreField<string>;
    HideAdditionalLuggage: ISitecoreField<string>;
    LuggageAddedButton: ISitecoreField<string>;
    LuggageAddedLabel: ISitecoreField<string>;
    NoLuggageAddedButton: ISitecoreField<string>;
    NoLuggageAddedLabel: ISitecoreField<string>;
    PramIcon: ISitecoreField<ISitecoreImage>;
    PramTitle: ISitecoreField<string>;
    PriceLabel: ISitecoreField<string>;
    ShowMoreEquipment: ISitecoreField<string>;
    ShowMoreLuggage: ISitecoreField<string>;
    SportsEquipmentTitle: ISitecoreField<string>;
    TextCancelPopup: ISitecoreField<string>;
    TitleCancelPopup: ISitecoreField<string>;
}

export type THoldLuggagePopupProps = ISitecoreComponent<IHoldLuggagePopupFields>;

export const HoldLuggagePopup: FC<THoldLuggagePopupProps> = ({ fields, rendering }) => {
    const {
        isScreenMedium,
        getPhrase,
        trackHoldLuggagePopupLoad,
        isHoldLuggagePopupOpened,
        isCancelPopupOpened,
        isHoldLuggageInitialized,
        hasLuggageSelectionChanged,
        clearUnconfirmedLuggage,
        setHoldLuggagePopupOpened,
        setCancelPopupOpened,
        setInitialStateFromSelection,
    } = useStore((stores: TStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        isHoldLuggagePopupOpened: stores.bookingStore.holdLuggage.isHoldLuggagePopupOpened,
        isCancelPopupOpened: stores.bookingStore.holdLuggage.isCancelPopupOpened,
        isHoldLuggageInitialized: stores.bookingStore.holdLuggage.isHoldLuggageInitialized,
        hasLuggageSelectionChanged: stores.bookingStore.holdLuggage.hasLuggageSelectionChanged,
        clearUnconfirmedLuggage: stores.bookingStore.holdLuggage.clearUnconfirmedLuggage,
        setHoldLuggagePopupOpened: stores.bookingStore.holdLuggage.setHoldLuggagePopupOpened,
        setCancelPopupOpened: stores.bookingStore.holdLuggage.setCancelPopupOpened,
        setInitialStateFromSelection: stores.bookingStore.holdLuggage.setInitialStateFromSelection,
        getPhrase: stores.layoutStore.getPhrase,
        trackHoldLuggagePopupLoad: stores.trackingStore.trackHoldLuggagePopupLoad,
    }));

    useEffect(() => {
        if (isHoldLuggagePopupOpened) {
            setInitialStateFromSelection();
            trackHoldLuggagePopupLoad();
        }
    }, [isHoldLuggagePopupOpened]);

    if (!fields || !isHoldLuggagePopupOpened) {
        return null;
    }

    const {
        BackToExtras,
        NoLuggageAddedLabel,
        LuggageAddedLabel,
        TitleCancelPopup,
        TextCancelPopup,
        BackButtonCancelPopup,
        ContinueButtonCancelPopup,
    } = fields;

    const backToPreviousPageClick = () => {
        if (hasLuggageSelectionChanged) {
            setCancelPopupOpened(true);

            return;
        }

        clearUnconfirmedLuggage();
        setHoldLuggagePopupOpened(false);
    };

    return (
        <FullScreenPopup
            ariaLabel={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPopup)}
            onClose={backToPreviousPageClick}
            disableReturnFocusOnUnmount
            fields={{
                BackToLabel: BackToExtras,
                BtnCancel: { value: getPhrase(SitecoreDictionary.GlobalsButtonsCancel) },
            }}
            navigationActionBlock={<HoldLuggagePopupActions {...fields} />}
            popupBarContent={
                <HoldLuggageInfoLabel
                    NoLuggageAddedLabel={NoLuggageAddedLabel}
                    LuggageAddedLabel={LuggageAddedLabel}
                    isMobileContent
                />
            }
            isMobile={!isScreenMedium}
            isInitialized={isHoldLuggageInitialized}
        >
            <>
                <HoldLuggagePopupContent fields={fields} rendering={rendering} />
                {isCancelPopupOpened && (
                    <HoldLuggageCancelPopup
                        TitleCancelPopup={TitleCancelPopup}
                        TextCancelPopup={TextCancelPopup}
                        BackButtonCancelPopup={BackButtonCancelPopup}
                        ContinueButtonCancelPopup={ContinueButtonCancelPopup}
                    />
                )}
            </>
        </FullScreenPopup>
    );
};

export default observer(HoldLuggagePopup);
