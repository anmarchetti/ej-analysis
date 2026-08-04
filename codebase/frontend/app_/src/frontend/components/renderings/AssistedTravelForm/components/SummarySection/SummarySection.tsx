import { FC, useCallback, useMemo, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import bookingService from 'frontend/services/booking.service';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getFullPassengerName } from 'frontend/utils/passenger.utils';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import Button from 'frontend/components/common/Button';
import ConfirmationCheckbox from 'frontend/components/renderings/AssistedTravelForm/components/ConfirmationCheckbox/ConfirmationCheckbox';
import QuestionHeader from 'frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader';
import { ISummarySectionFields } from 'frontend/components/renderings/AssistedTravelForm/models/interface';
import { PopupType, TFormAnswers } from 'frontend/components/renderings/AssistedTravelForm/models/types';
import { getAnswersBySection } from 'frontend/components/renderings/AssistedTravelForm/utils/DynamicForm.utils';

import styles from './SummarySection.module.scss';

export interface ISummarySectionProps {
    answers: TFormAnswers;
    fields: ISummarySectionFields;
    togglePopup: (popup: PopupType | null) => void;
    bookingReference?: string;
    selectedCustomer?: IGuestPassenger;
}

const SummarySection: FC<ISummarySectionProps> = ({
    fields,
    answers,
    selectedCustomer,
    bookingReference,
    togglePopup,
}) => {
    const [isSubmissionInProgress, setIsSubmissionInProgress] = useState(false);
    const [isSubmissionSuccess, setIsSubmissionSuccess] = useState(false);
    const [isInformationAccurateChecked, setIsInformationAccurateChecked] = useState(false);
    const [showErrorConformationCheckboxes, setShowErrorConformationCheckboxes] = useState(false);

    const { getPhrase, markGuestAsRequested } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        markGuestAsRequested: stores.viewBookingStore.markGuestAsRequested,
    }));

    const {
        PrimaryButtonLabel,
        PrimaryButtonScreenReaderText,
        SecondaryButtonLabel,
        SecondaryButtonScreenReaderText,
        Description,
        Title,
        CustomerLabelSummary,
        InformationAccurateTitle,
        InformationAccurateDescription,
        InformationAccurateRequiredErrorMessage,
    } = fields;

    const sectionSummaries = useMemo(() => {
        const customerName = selectedCustomer ? getFullPassengerName(selectedCustomer, getPhrase) : '';

        return getAnswersBySection(answers, customerName, CustomerLabelSummary.value);
    }, [answers, selectedCustomer, CustomerLabelSummary, getPhrase]);

    const handleSubmit = useCallback(async (): Promise<void> => {
        if (!isInformationAccurateChecked) {
            setShowErrorConformationCheckboxes(true);

            return;
        }

        setShowErrorConformationCheckboxes(false);

        if (!selectedCustomer || !bookingReference) {
            return;
        }

        const passengerName = `${selectedCustomer.firstName} ${selectedCustomer.lastName}`;
        const questionsAndAnswers = Array.from(answers.entries()).map(([questionId, answer]) => ({
            question: answer.questionTextForSubmission || answer.questionText,
            answer: answer.answers.map(a => String(a.valueForSubmission || a.value || '')).join('; '),
            questionCode: questionId,
        }));

        try {
            setIsSubmissionInProgress(true);
            await bookingService.requestAssistedTravel(bookingReference, passengerName, questionsAndAnswers);
            markGuestAsRequested(passengerName);
            togglePopup(PopupType.SubmissionSuccess);
            setIsSubmissionSuccess(true);
        } catch {
            togglePopup(PopupType.SubmissionFailed);
        } finally {
            setIsSubmissionInProgress(false);
        }
    }, [bookingReference, selectedCustomer, togglePopup, answers, isInformationAccurateChecked, markGuestAsRequested]);

    return (
        <>
            <QuestionHeader title={Title.value} description={Description.value} />
            <div className={styles.sectionContainer}>
                {sectionSummaries.map((section, index) => (
                    <div key={section.sectionGroup} className={styles.section} data-tid={`section-${index}`}>
                        <Text className={styles.sectionTitle} tag='h3' field={{ value: section.sectionGroup }} />
                        <div className={styles.content}>
                            {section.answers.map((question, index) => (
                                <>
                                    <div key={question.questionText} className={styles.question}>
                                        <div className={styles.questionText}>{question.questionText}</div>
                                        {question.answers.length > 1 && (
                                            <ul className={styles.answerValues}>
                                                {question.answers.map(a => (
                                                    <li key={a.value}>{a.value}</li>
                                                ))}
                                            </ul>
                                        )}
                                        {question.answers.length === 1 && (
                                            <div className={styles.answerValues}>{question.answers[0].value}</div>
                                        )}
                                    </div>
                                    {section.answers.length - 1 !== index && <hr className={styles.divider} />}
                                </>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <ConfirmationCheckbox
                checked={isInformationAccurateChecked}
                Title={InformationAccurateTitle}
                Description={InformationAccurateDescription}
                ErrorContent={InformationAccurateRequiredErrorMessage}
                onChange={(): void => setIsInformationAccurateChecked(prev => !prev)}
                hasError={!isInformationAccurateChecked && showErrorConformationCheckboxes}
                id='information-accurate-checkbox'
            />
            <div className={styles.btnContainer}>
                <Button
                    isText
                    onClick={(): void => togglePopup(PopupType.GoBackToStartWarning)}
                    className={styles.btn}
                    aria-label={SecondaryButtonScreenReaderText?.value}
                    data-tid='back-button'
                >
                    {SecondaryButtonLabel?.value}
                </Button>
                <Button
                    isMedium
                    onClick={handleSubmit}
                    className={styles.btn}
                    aria-label={PrimaryButtonScreenReaderText?.value}
                    isLoading={isSubmissionInProgress}
                    disabled={isSubmissionSuccess}
                    data-tid='submit-button'
                >
                    {PrimaryButtonLabel?.value}
                </Button>
            </div>
        </>
    );
};

export default SummarySection;
