import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import { useChatbotTracking } from 'frontend/hooks/useChatbotTracking/useChatbotTracking';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { containsFAndHPromoCode } from 'frontend/utils/offer.utils';
import { getFullPassengerName } from 'frontend/utils/passenger.utils';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { GuestType } from 'models/enum/GuestType';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import CustomerSelectionSection from './components/CustomerSelectionSection/CustomerSelectionSection';
import DynamicForm from './components/DynamicForm/DynamicForm';
import FormHeader from './components/FormHeader/FormHeader';
import IntroductionSection from './components/IntroductionSection/IntroductionSection';
import LoadingState from './components/LoadingState/LoadingState';
import Popup from './components/Popup/Popup';
import SummarySection from './components/SummarySection/SummarySection';
import { useDynamicForm } from './hooks/useDynamicForm';
import { ASSISTED_TRAVEL_FORM_DEFINITION } from './mocks/AssistedTravelFormDefinition.mocks';
import { IAssistedTravelFormFields } from './models/interface';
import { PopupType, Screen } from './models/types';
import { getPopupProps } from './utils/AssistedTravelForm.utils';
import { transformFormDefinition } from './utils/DynamicForm.utils';

import styles from './AssistedTravelForm.module.scss';

export type TAssistedTravelFormProps = ISitecoreComponent<IAssistedTravelFormFields>;

const AssistedTravelForm: FC<TAssistedTravelFormProps> = ({ fields }) => {
    const {
        booking,
        redirectToViewBookingPage,
        getPhrase,
        initializeBookingFromPayload,
        initializeAssistedTravelRequestsFetch,
        clearAssistedTravelRequests,
        isAssistedTravelRequestsLoading,
        isAssistedTravelRequestsFailedToLoad,
    } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
        redirectToViewBookingPage: stores.routerStore.redirectToViewBookingPage,
        getPhrase: stores.layoutStore.getPhrase,
        initializeBookingFromPayload: stores.viewBookingStore.initializeBookingFromPayload,
        initializeAssistedTravelRequestsFetch: stores.viewBookingStore.initializeAssistedTravelRequestsFetch,
        clearAssistedTravelRequests: stores.viewBookingStore.clearAssistedTravelRequests,
        isAssistedTravelRequestsLoading: stores.viewBookingStore.isAssistedTravelRequestsLoading,
        isAssistedTravelRequestsFailedToLoad: stores.viewBookingStore.isAssistedTravelRequestsFailedToLoad,
    }));

    const [selectedCustomer, setSelectedCustomer] = useState<IGuestPassenger | undefined>(undefined);
    const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Introduction);
    const [visiblePopup, setVisiblePopup] = useState<PopupType | null>(null);

    const customerFullName = useMemo(() => {
        if (!selectedCustomer) {
            return '';
        }

        return getFullPassengerName(selectedCustomer, getPhrase);
    }, [selectedCustomer, getPhrase]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentScreen]);

    useChatbotTracking(booking, containsFAndHPromoCode(booking?.promoCollections || []));

    const travelCompanions: string[] = useMemo(() => {
        if (!booking) {
            return [];
        }

        return booking.guests
            .filter(guest => guest.type === GuestType.Adult && guest.index !== selectedCustomer?.index)
            .map(guest => getFullPassengerName(guest, getPhrase));
    }, [booking, selectedCustomer, getPhrase]);

    const mappedFormDefinition = useMemo(() => {
        if (!fields) {
            return ASSISTED_TRAVEL_FORM_DEFINITION;
        }

        return transformFormDefinition(ASSISTED_TRAVEL_FORM_DEFINITION, fields, travelCompanions);
    }, [fields, travelCompanions]);

    const formState = useDynamicForm(mappedFormDefinition, setCurrentScreen, setVisiblePopup);
    const { currentSectionName, currentStepInProgressBar, totalProgressBarSteps, resetDynamicForm, goToFormStart } =
        formState;

    useEffect(() => {
        initializeBookingFromPayload().then(() => {
            initializeAssistedTravelRequestsFetch(false, true);
        });

        globalThis.history.pushState(null, '', globalThis.location.href);

        const handlePopState = (event: PopStateEvent): void => {
            event.preventDefault();
            togglePopup(PopupType.BackButtonWarning);

            globalThis.history.pushState(null, '', globalThis.location.href);
        };

        globalThis.addEventListener('popstate', handlePopState);

        return () => {
            globalThis.removeEventListener('popstate', handlePopState);
            clearAssistedTravelRequests();
        };
    }, []);

    const selectCustomer = useCallback(
        (customer: IGuestPassenger): void => {
            setSelectedCustomer(prev => {
                if (prev?.index !== customer.index) {
                    resetDynamicForm();
                }

                return customer;
            });
        },
        [resetDynamicForm],
    );

    const goToScreen = useCallback((screen: Screen): void => {
        setCurrentScreen(screen);
    }, []);

    const togglePopup = useCallback((popup: PopupType | null): void => {
        setVisiblePopup(popup);
    }, []);

    useEffect(() => {
        if (isAssistedTravelRequestsFailedToLoad) {
            togglePopup(PopupType.FailedToLoadAssistedTravelRequests);
        }
    }, [isAssistedTravelRequestsFailedToLoad, togglePopup]);

    const startFromTheBeginning = useCallback((): void => {
        setSelectedCustomer(undefined);
        resetDynamicForm();
        goToScreen(Screen.Introduction);
    }, [resetDynamicForm, goToScreen]);

    if (!fields) {
        return null;
    }

    const popupContent = getPopupProps(
        visiblePopup,
        fields,
        togglePopup,
        redirectToViewBookingPage,
        startFromTheBeginning,
        goToFormStart,
        goToScreen,
    );
    const currentSectionTitle =
        currentScreen === Screen.DynamicSection ? currentSectionName : fields.SummarySectionFields.fields.Title.value;

    const renderSection = (): JSX.Element | null => {
        switch (currentScreen) {
            case Screen.Introduction:
                return (
                    <IntroductionSection
                        fields={fields.IntroductionSectionFields.fields}
                        goToScreen={goToScreen}
                        togglePopup={togglePopup}
                    />
                );
            case Screen.CustomerSelection:
                return (
                    <CustomerSelectionSection
                        fields={fields.CustomerSelectionSectionFields.fields}
                        selectCustomer={selectCustomer}
                        goToScreen={goToScreen}
                    />
                );
            case Screen.Summary:
                return (
                    <SummarySection
                        fields={fields.SummarySectionFields.fields}
                        answers={formState.answers}
                        selectedCustomer={selectedCustomer}
                        togglePopup={togglePopup}
                        bookingReference={booking?.bookingReference}
                    />
                );
            default:
                return <DynamicForm formState={formState} togglePopup={togglePopup} />;
        }
    };

    return (
        <div>
            <FormHeader
                fields={fields}
                currentScreen={currentScreen}
                customerFullName={customerFullName}
                isAdult={selectedCustomer?.type === GuestType.Adult}
                togglePopup={togglePopup}
                currentStepInProgressBar={currentStepInProgressBar}
                currentSectionTitle={currentSectionTitle}
                totalProgressBarSteps={totalProgressBarSteps}
            />
            {isAssistedTravelRequestsLoading ? (
                <LoadingState />
            ) : (
                <div
                    className={classNames('wrapper-component-container__inner', styles.formContainer)}
                    id='form-container'
                >
                    {renderSection()}
                </div>
            )}
            {popupContent && (
                <Popup
                    {...popupContent}
                    customerFullName={customerFullName}
                    emailAddress={booking?.leadPassenger?.email}
                />
            )}
        </div>
    );
};

export default observer(AssistedTravelForm);
