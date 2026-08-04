import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';

import useStore from 'frontend/hooks/useStore';
import { BaseLayoutStore } from 'frontend/store/base';
import { isHolidayStore } from 'frontend/store/holidays';
import { OfferSectionTypes } from 'frontend/store/holidays/guestDetails/GuestDetailsStore';
import { TStores } from 'frontend/store/IStores';
import { smoothScrollIntoView } from 'frontend/utils/ui.utils';
import { ICustomerLoginError } from 'models/data/LoginCustomer';
import { GuestInfo } from 'models/GuestInfo';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { IGuestPageFields } from 'frontend/components/renderings/GuestDetails/GuestDetails.utils';

export interface IUseGuestDetailsFullProps {
    fields?: IGuestPageFields;
}

interface IUseGuestDetailsFullData {
    adults: GuestInfo[];
    changeOffersAndUpdates: ((field: OfferSectionTypes, value: boolean) => void) | undefined;
    children: GuestInfo[];
    fatalError: React.ReactNode | false;

    forceErrors: boolean;
    getPhrase: BaseLayoutStore['getPhrase'];

    hasDisabledStyles: boolean;

    ignoreAnimation: boolean;
    infants: GuestInfo[];
    isOffersOptedIn: Nullable<boolean>;
    isPartnerOffersOptedIn: Nullable<boolean>;
    isSpecialOffersShown: boolean | undefined;
    nonFatalError: React.ReactNode | false;
    onClick: () => void;
}

export const scrollIntoErrors = ({
    setIgnoreAnimation,
}: {
    setIgnoreAnimation: Dispatch<SetStateAction<boolean>>;
}): void => {
    const blocks = document.getElementsByClassName('will-be-invalid');
    const nodes = document.getElementsByClassName('error');

    if (!blocks.length && !nodes.length) return;

    setIgnoreAnimation(true);

    // edge case: if block (with errors) is collapsed
    // we need to expand it to showing content
    Array.from(blocks).forEach((block: HTMLDivElement): void => {
        const isCollapsed = block.dataset.status === 'collapsed';

        if (isCollapsed) {
            block.querySelector('button')?.click();
        }
    });

    requestAnimationFrame(async () => {
        const el = (blocks[0]?.querySelector('.error') || nodes[0]) as HTMLElement;

        await smoothScrollIntoView(el, {
            duration: 500,
            block: 'center',
        });

        setIgnoreAnimation(false);
    });
};

export const useGuestDetailsFull = ({ fields }: IUseGuestDetailsFullProps): IUseGuestDetailsFullData => {
    const {
        adults,
        children,
        infants,
        confirmPolicy,
        toggleForceErrors,
        forceErrors,
        isFormValid,
        formErrors,
        trackValidation,
        getPhrase,
        onSelectContinue,
        isLoggedIn,
        shouldCreateAccount,
        customerLogin,
        isPartnerOffersOptedIn,
        isOffersOptedIn,
        changeOffersAndUpdates,
        initializeGuestsInfoPage,
        setIsAddressLookup,
    } = useStore((stores: TStores) => ({
        adults: stores.guestDetailsStore.adults,
        children: stores.guestDetailsStore.children,
        infants: stores.guestDetailsStore.infants,
        confirmPolicy: stores.guestDetailsStore.confirmPolicy,
        toggleForceErrors: stores.guestDetailsStore.toggleForceErrors,
        forceErrors: stores.guestDetailsStore.forceErrors,

        isFormValid: stores.guestDetailsStore.isFormValid,
        formErrors: stores.guestDetailsStore.formErrors,
        trackValidation: stores.trackingStore.trackValidation,
        getPhrase: stores.layoutStore.getPhrase,
        onSelectContinue: stores.guestDetailsStore.onSelectContinue,
        isLoggedIn: stores.userStore.isLoggedIn,

        ...(isHolidayStore(stores) && {
            shouldCreateAccount: stores.guestDetailsStore.shouldCreateAccount,
            customerLogin: stores.guestDetailsStore.customerLogin,
            isPartnerOffersOptedIn: stores.guestDetailsStore.isPartnerOffersOptedIn,
            isOffersOptedIn: stores.guestDetailsStore.isOffersOptedIn,
            changeOffersAndUpdates: stores.guestDetailsStore.changeOffersAndUpdates,
            initializeGuestsInfoPage: stores.guestDetailsStore.initializeGuestsInfoPage,
            setIsAddressLookup: stores.guestDetailsStore.setIsAddressLookup,
        }),
    }));
    const customerLoginError = customerLogin?.firstError || null;

    const [ignoreAnimation, setIgnoreAnimation] = useState(false);

    useEffect(() => {
        initializeGuestsInfoPage?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onContinue = async (): Promise<void> => {
        formErrors.forEach(error => {
            trackValidation(error.propertyName, error.errorMessage);
        });

        if (isFormValid) {
            try {
                await onSelectContinue();
            } catch {
                scrollToErrors();
            }
        } else {
            setIsAddressLookup?.(false);
            scrollToErrors();
        }
    };

    const scrollToErrors = (): void => {
        toggleForceErrors(true);

        requestAnimationFrame(() => {
            scrollIntoErrors({ setIgnoreAnimation });
        });
    };

    const renderErrorMessage = (error: ICustomerLoginError): React.ReactNode => (
        <ErrorMessage
            message={getPhrase(error.title)}
            description={error.description && getPhrase(error.description)}
            errorMessageClass='error-container error'
            icon={
                <i className='error-message__icon'>
                    <SvgWarningFilled />
                </i>
            }
        />
    );

    return {
        adults,
        children,
        infants,
        getPhrase,

        fatalError: customerLoginError && customerLoginError.isFatal && renderErrorMessage(customerLoginError),
        nonFatalError: customerLoginError && !customerLoginError.isFatal && renderErrorMessage(customerLoginError),

        isSpecialOffersShown: !!fields && !isLoggedIn && shouldCreateAccount,

        isOffersOptedIn,
        isPartnerOffersOptedIn,
        forceErrors,
        changeOffersAndUpdates,

        onClick: onContinue,
        hasDisabledStyles: !(confirmPolicy && isFormValid),
        ignoreAnimation,
    };
};

export default useGuestDetailsFull;
