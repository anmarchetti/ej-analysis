import { useEffect } from 'react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { GuestDetailsPhase } from 'models/enum/GuestDetailsPhase';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { IOffersAndUpdatesFields } from './components/SpecialOffersBlock';

export interface IGuestPageFields extends IOffersAndUpdatesFields {
    BlacklistedDomains: ISitecoreField<string>;
    BlacklistedEmails: ISitecoreField<string>;
    CheckboxLabel: ISitecoreField<string>;
    GuestInformationDescription: ISitecoreField<string>;
    GuestInformationTitle: ISitecoreField<string>;
    HasSignInPrompt: ISitecoreField<boolean>;
    HidePageTitle: ISitecoreField<boolean>;
    ImportantInformation: ISitecoreField<string>;
    RemoveAllLabel: ISitecoreField<string>;
    SurnameTooltip: ISitecoreField<string>;
}

interface IUseGuestDetailsProps {
    fields?: IGuestPageFields;
}

interface IUseGuestDetailsData {
    hasSignInPrompt: boolean;
    isAdvanced: boolean;
    isDisplayed: boolean;
    isEmailVerificationShown: boolean;
    isGuestsInfoShown: boolean;
    isHolidaysLoading: boolean;
    isPageTitleVisible: boolean;
    isTradePortal: boolean;
    pageTitle: string;
}

const useGuestDetails = ({ fields }: IUseGuestDetailsProps): IUseGuestDetailsData => {
    const {
        pageTitle,
        isTradePortal,
        initialize,
        saveGuestDetailsToSessionStorage,
        isSummaryBarEnabled,
        isSummaryBarHidden,
        guestDetailsPhase,
        clearGuestDetailsPhase,
    } = useStore((stores: TStores) => ({
        pageTitle: stores.layoutStore.pageTitle,
        isTradePortal: stores.layoutStore.isTradePortal,
        initialize: stores.guestDetailsStore.initialize,
        saveGuestDetailsToSessionStorage: stores.guestDetailsStore.saveGuestDetailsToSessionStorage,
        isSummaryBarEnabled: stores.layoutStore.isSummaryBarEnabled,
        isSummaryBarHidden: stores.layoutStore.isSummaryBarHidden,

        ...(isHolidayStore(stores) && {
            guestDetailsPhase: stores.guestDetailsStore.guestDetailsPhase,
            clearGuestDetailsPhase: stores.guestDetailsStore.clearGuestDetailsPhase,
        }),
    }));

    const hasSignInPrompt = !!fields?.HasSignInPrompt?.value;

    useEffect(() => {
        initialize(hasSignInPrompt);

        return (): void => {
            saveGuestDetailsToSessionStorage();
            clearGuestDetailsPhase?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isHolidaysLoading = !isTradePortal && !guestDetailsPhase;
    const isEmailVerificationShown = guestDetailsPhase === GuestDetailsPhase.VerifyEmail;
    const isGuestsInfoShown = isTradePortal || guestDetailsPhase === GuestDetailsPhase.GuestsInfo;
    const hidePageTitle = !!fields?.HidePageTitle?.value;

    return {
        isDisplayed: !!fields,
        isAdvanced: isSummaryBarEnabled && !isSummaryBarHidden,
        pageTitle,
        isPageTitleVisible: !hidePageTitle,
        isHolidaysLoading,
        isEmailVerificationShown,
        isGuestsInfoShown,
        isTradePortal,
        hasSignInPrompt,
    };
};

export default useGuestDetails;
