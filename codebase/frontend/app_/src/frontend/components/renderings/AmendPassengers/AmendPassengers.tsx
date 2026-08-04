import React, { useEffect, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-react';
import { observer } from 'mobx-react';
import { useRouter } from 'next/router';

import { Tokens } from 'code/tokens';
import { useEffectIfTruthy } from 'frontend/hooks/useEffectIfTruthy';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { HeaderEvents, IHeaderEventsPayload } from 'models/customEvents/HeaderEvents';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Link from 'frontend/components/common/Link';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import { AmendGuestCard } from 'frontend/components/renderings/AmendPassengers/components/AmendGuestCard/AmendGuestCard';
import ErrorPopup from 'frontend/components/renderings/AmendPassengers/components/ErrorPopup/ErrorPopup';
import { PageLeavePopUp } from 'frontend/components/renderings/AmendPassengers/components/PageLeavePopUp/PageLeavePopUp';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

import { withAmendPassengersLocalStore } from './stores/amendPassengerLocalStore';

import styles from './AmendPassengers.module.scss';

const CLICKABLE_ELEMENTS = ['A', 'BUTTON'];

export interface IAmendPassengersFields {
    AdultIcon: ISitecoreField<ISitecoreImage>;
    AgedLabel: ISitecoreField<string>;
    BackToPassengerDetailsBtnText: ISitecoreField<string>;
    ChangeLimitRestriction: ISitecoreField<string>;
    CharacterCountExceededAdvice: ISitecoreField<string>;
    CharacterCountExceededWarning: ISitecoreField<string>;
    CharacterCountWarning: ISitecoreField<string>;
    CharacterLimitRestriction: ISitecoreField<string>;
    ChildIcon: ISitecoreField<ISitecoreImage>;
    EditPassengerDetailsCTA: ISitecoreField<string>;
    EditingLabel: ISitecoreField<string>;
    ErrorPopupIcon: ISitecoreField<ISitecoreImage>;
    ErrorPopupSubtext: ISitecoreField<string>;
    ErrorPopupTitle: ISitecoreField<string>;
    FieldCantBeChangedTooltipText: ISitecoreField<string>;
    HeaderBackText: ISitecoreField<string>;
    InfantIcon: ISitecoreField<ISitecoreImage>;
    LeadPassengerRestriction: ISitecoreField<string>;
    LoadingSpinnerText: ISitecoreField<string>;
    MobileDrawerHeaderBg: ISitecoreField<ISitecoreImage>;
    NameChangeTitle: ISitecoreField<string>;
    Phone: ISitecoreField<string>;
    PopupWarningIcon: ISitecoreField<ISitecoreImage>;
    RemovePassengerBtnText: ISitecoreField<string>;
    RemovePassengerRestriction: ISitecoreField<string>;
    RestrictionsPopupTitle: ISitecoreField<string>;
    SavePassengerDetailsCTA: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    UnsavedPopupSubtext: ISitecoreField<string>;
    UnsavedPopupTitle: ISitecoreField<string>;
}

export const AmendPassengers = ({ fields, rendering }: ISitecoreComponent<IAmendPassengersFields>) => {
    const {
        initializeStore,
        clearStore,
        guestsToEdit,
        getPhrase,
        haveUnsavedChanges,
        isScreenMedium,
        isScreenLessMedium,
        isSubmitPending,
        isLoadingPassengers,
        submitError,
        resetSubmitError,
        submitChanges,
        isShowRestrictionInfoEnabled,
        amendPassengerNameCharacterCount,
        isSuccessfullySubmitted,
        redirectTo,
        listenToPopState,
        onLogout,
        redirectToViewBookingPage,
    } = useStore((stores: IHolidaysStores) => ({
        initializeStore: stores.amendPassengerStore.initialize,
        clearStore: stores.amendPassengerStore.clearStore,
        guestsToEdit: stores.amendPassengerStore.guestsToEdit,
        haveUnsavedChanges: stores.amendPassengerStore.haveUnsavedChanges,
        isScreenMedium: stores.appStore.isScreenMedium,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        submitChanges: stores.amendPassengerStore.submitChanges,
        isShowRestrictionInfoEnabled: stores.amendPassengerStore.isShowRestrictionInfoEnabled,
        amendPassengerNameCharacterCount: stores.amendPassengerStore.amendPassengerNameCharacterCount,
        isSubmitPending: stores.amendPassengerStore.isSubmitPending,
        isLoadingPassengers: stores.amendPassengerStore.isLoadingPassengers,
        submitError: stores.amendPassengerStore.submitError,
        resetSubmitError: stores.amendPassengerStore.resetSubmitError,
        isSuccessfullySubmitted: stores.amendPassengerStore.isSuccessfullySubmitted,
        getPhrase: stores.layoutStore.getPhrase,
        redirectTo: stores.routerStore.redirectTo,
        listenToPopState: stores.routerStore.listenToPopState,
        onLogout: stores.userStore.onLogout,
        redirectToViewBookingPage: stores.routerStore.redirectToViewBookingPage,
    }));

    const router = useRouter();

    const [preventedUrl, setPreventedUrl] = useState('');
    const [isChangeCancelled, setIsChangeCancelled] = useState(false);
    const [isErrorPopupOpen, setIsErrorPopupOpen] = useState(false);

    const dispatchHeaderEvent = (isOpen = false) => {
        const event = new CustomEvent<IHeaderEventsPayload[HeaderEvents.ToggleMobile]>(HeaderEvents.ToggleMobile, {
            detail: { isOpen },
        });
        document.dispatchEvent(event);
    };

    const onUnsavedChangedPopupClose = () => {
        setPreventedUrl('');

        if (!isScreenMedium) dispatchHeaderEvent();
    };

    const onErrorPopupClose = () => {
        resetSubmitError();
        setIsErrorPopupOpen(false);
        redirectToViewBookingPage();
    };

    // add listeners for the page close or redirect if haveUnsavedChanges = true
    // when isSuccessfullySubmitted or isChangeCancelled - remove listeners and redirects to the boooking or preventedUrl
    useEffect(() => {
        let isContactLink = false;
        let popStateUnsubscribe;

        // tab close and page reload
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isContactLink) {
                e.preventDefault();
                e.stopPropagation();

                return (e.returnValue = "You haven't confirmed all your changes");
            }

            return null;
        };

        const handleLinkClick = event => {
            const target = event.target;
            isContactLink = false;

            // Check if the clicked element or its parent is an <a> or <button> element
            if (CLICKABLE_ELEMENTS.includes(target.tagName) || CLICKABLE_ELEMENTS.includes(target.parentNode.tagName)) {
                const anchor = target.tagName === 'A' ? target : target.parentNode;
                const anchorHref = anchor.getAttribute('href');

                const isOpenInNewTab = anchor.getAttribute('target') === '_blank';
                const isEmpty = !anchor.dataset.logout && (!anchorHref || /^(https?:\/\/|#)$/.test(anchorHref));
                isContactLink = /^(tel|mailto):/.test(anchorHref);
                const isMobileHeaderLinkWithChilds =
                    isScreenLessMedium &&
                    anchor.parentNode.tagName === 'LI' &&
                    anchor.parentNode.classList.contains('has-children');

                const isRedirectLink = !isOpenInNewTab && !isEmpty && !isMobileHeaderLinkWithChilds && !isContactLink;

                if (isRedirectLink) {
                    event.preventDefault();
                    event.stopPropagation();
                    setPreventedUrl(anchor.dataset.logout ? QueryParamName.Logout : anchor.href);
                }
            }
        };

        const handlePopState = ({ as }) => {
            if (!as.includes(SitePath.PassengerDetails)) {
                setPreventedUrl(as);

                history.forward();
            }

            return false;
        };

        const isChangeFinished = isSuccessfullySubmitted || isChangeCancelled;

        if (haveUnsavedChanges && !isChangeFinished) {
            addEventListener('beforeunload', handleBeforeUnload, { capture: true });
            addEventListener('click', handleLinkClick, { capture: true });
            popStateUnsubscribe = listenToPopState(handlePopState);
        } else if (isChangeFinished) {
            if (preventedUrl) {
                if (preventedUrl === QueryParamName.Logout) {
                    onLogout();
                } else {
                    router.push(preventedUrl);
                }
            } else {
                redirectTo(SitePath.ViewBooking);
            }

            if (!isScreenMedium) {
                dispatchHeaderEvent();
            }
        }

        if (submitError) setIsErrorPopupOpen(true);

        return () => {
            removeEventListener('beforeunload', handleBeforeUnload, { capture: true });
            removeEventListener('click', handleLinkClick, { capture: true });
            popStateUnsubscribe?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [haveUnsavedChanges, preventedUrl, isSuccessfullySubmitted, submitError, isChangeCancelled]);

    useEffect(() => {
        initializeStore();

        return clearStore;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffectIfTruthy(() => {
        onUnsavedChangedPopupClose();
    }, submitError);

    if (!guestsToEdit?.length && !isLoadingPassengers) return null;

    const footerButtons = (
        <div className={styles.footerButtons}>
            <Link href={SitePath.ViewBooking} legacyBehavior>
                <a data-tid='cancel-link' className={`btn btn--transparent ` + styles.footerButton}>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                </a>
            </Link>

            <Button
                data-tid='submit-changes'
                onClick={submitChanges}
                isLoading={isSubmitPending}
                disabled={!haveUnsavedChanges}
                className={styles.footerButton}
            >
                {getPhrase(
                    isScreenMedium
                        ? SitecoreDictionary.GlobalsButtonsConfirmChanges
                        : SitecoreDictionary.GlobalsButtonsConfirm,
                )}
            </Button>
        </div>
    );

    return (
        <>
            {isShowRestrictionInfoEnabled && (
                <ComponentWrapper>
                    <Placeholder
                        name={PlaceholderNames.AttentionMessage}
                        rendering={rendering}
                        className={styles.infoMessage}
                        tokenizer={{
                            token: Tokens.Amount,
                            value: amendPassengerNameCharacterCount,
                        }}
                        collapsible
                    />
                </ComponentWrapper>
            )}

            <ComponentWrapper>
                {guestsToEdit?.map(guest => (
                    <AmendGuestCard key={guest.initialDetails.index} fields={fields} guestToEdit={guest} />
                ))}

                {/* Show loading spinner whilst waiting for the API to return, or whilst redirecting back to view booking page */}
                {(isSubmitPending || isSuccessfullySubmitted) && (
                    <OverlaySpinner header={fields?.LoadingSpinnerText?.value} />
                )}
            </ComponentWrapper>

            {isScreenMedium ? <ComponentWrapper>{footerButtons}</ComponentWrapper> : footerButtons}
            {preventedUrl && (
                <PageLeavePopUp
                    fields={fields}
                    onSave={submitChanges}
                    onCancel={() => setIsChangeCancelled(true)}
                    onClose={onUnsavedChangedPopupClose}
                    // isSuccessfullySubmitted is added because redirect can be slow and user can click again
                    isLoading={isSubmitPending || isSuccessfullySubmitted}
                />
            )}

            {isErrorPopupOpen && (
                <ErrorPopup
                    id='generic-error-popup'
                    fields={fields}
                    onClose={onErrorPopupClose}
                    error={{
                        errorType: 'Generic',
                        errorStatus: submitError?.status,
                    }}
                />
            )}
        </>
    );
};

export default withAmendPassengersLocalStore(observer(AmendPassengers));
