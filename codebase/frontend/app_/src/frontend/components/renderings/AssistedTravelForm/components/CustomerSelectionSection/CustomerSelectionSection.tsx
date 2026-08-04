import { FC } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { GuestType } from 'models/enum/GuestType';
import SvgArrow from 'frontend/components/icons-new/Arrow';
import SvgChildCircleFilled from 'frontend/components/icons-new/ChildCircleFilled';
import SvgUserCircleFilled from 'frontend/components/icons-new/UserCircleFilled';
import inputStyles from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/Inputs.module.scss';
import QuestionHeader from 'frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader';
import SectionWrapper from 'frontend/components/renderings/AssistedTravelForm/components/SectionWrapper/SectionWrapper';
import { ICustomerSelectionSectionFields } from 'frontend/components/renderings/AssistedTravelForm/models/interface';
import { Screen } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import styles from './CustomerSelectionSection.module.scss';

export interface ICustomerSelectionSectionProps {
    fields: ICustomerSelectionSectionFields;
    goToScreen: (screen: Screen) => void;
    selectCustomer: (guest: IGuestPassenger) => void;
}

const CustomerSelectionSection: FC<ICustomerSelectionSectionProps> = ({ fields, selectCustomer, goToScreen }) => {
    const { guestWithAssistedTravelRequest } = useStore((stores: IHolidaysStores) => ({
        guestWithAssistedTravelRequest: stores.viewBookingStore.guestWithAssistedTravelRequest,
    }));

    const onUserClick = (guest: IGuestPassenger): void => {
        selectCustomer(guest);
        goToScreen(Screen.DynamicSection);
    };

    const onSecondaryButtonClick = (): void => {
        goToScreen(Screen.Introduction);
    };

    const {
        Title,
        Description,
        SecondaryButtonLabel,
        SecondaryButtonScreenReaderText,
        Under18Label,
        AssistedRequestedOnLabel,
    } = fields;

    return (
        <SectionWrapper
            secondaryBtnText={SecondaryButtonLabel}
            secondaryBtnScreenReaderText={SecondaryButtonScreenReaderText}
            secondaryBtnAction={onSecondaryButtonClick}
        >
            <fieldset className={inputStyles.fieldset} aria-required='true'>
                <QuestionHeader title={Title.value} description={Description.value} />
                <div className={styles.guests}>
                    {guestWithAssistedTravelRequest?.map(({ passenger, passengerName, requestedAt }) => {
                        const isDisabled = !!requestedAt;
                        const requestedOnText = isDisabled
                            ? Tokenizer.replaceToken(AssistedRequestedOnLabel.value, Tokens.Date, requestedAt)
                            : '';

                        return (
                            <button
                                key={passenger.index}
                                onClick={(): void => onUserClick(passenger)}
                                className={styles.guestButton}
                                disabled={isDisabled}
                                data-tid={'guest-button-' + passenger.index}
                            >
                                <div className={styles.guestInfo}>
                                    <div className={styles.guestName}>
                                        {passenger.type === GuestType.Adult ? (
                                            <SvgUserCircleFilled />
                                        ) : (
                                            <SvgChildCircleFilled />
                                        )}
                                        <div>
                                            {passengerName} {passenger.type !== GuestType.Adult && Under18Label.value}
                                        </div>
                                    </div>
                                    {!isDisabled && <SvgArrow className={styles.arrowIcon} />}
                                </div>
                                {isDisabled && <div className={styles.requestedOn}>{requestedOnText}</div>}
                            </button>
                        );
                    })}
                </div>
            </fieldset>
        </SectionWrapper>
    );
};

export default CustomerSelectionSection;
