import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import styles from 'frontend/components/common/InspireMeQuestionFooter/QuestionFooter.module.scss';
import IconChevronLeft from 'frontend/components/icons-new/ChevronLeft';

export interface IQuestionFooterProps {
    backButtonClassName?: string;
    children?: React.ReactNode;
    className?: string;
    isBackButtonDisabled?: boolean;
    isNextButtonDisabled?: boolean;
    nextButtonClassName?: string;
    nextButtonText?: string;
    onBackClick?: () => void;
    onNextClick?: () => void;
    prevButtonText?: string;
}

const QuestionFooter: FC<IQuestionFooterProps> = ({
    onNextClick,
    onBackClick,
    isNextButtonDisabled,
    isBackButtonDisabled,
    className,
    prevButtonText,
    nextButtonText,
    backButtonClassName,
    nextButtonClassName,
    children,
}) => {
    const { getPhrase, isNextButtonLoading, isPrevButtonLoading } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isNextButtonLoading: stores.inspireMeStore.isNextAvailableAnswersAreLoading,
        isPrevButtonLoading: stores.inspireMeStore.isPrevAvailableAnswersAreLoading,
    }));

    return (
        <div className={styles.position}>
            {children}
            <div className={classNames(styles.wrapper, className)} data-tid='inspire-me-footer'>
                <Button
                    onClick={onBackClick}
                    isTransparent
                    className={classNames(styles.backButton, backButtonClassName)}
                    dataTid='quiz-prev-question'
                    disabled={isBackButtonDisabled}
                    isLoading={isPrevButtonLoading}
                >
                    <IconChevronLeft />
                    {prevButtonText ?? getPhrase(SitecoreDictionary.GlobalsButtonsBack)}
                </Button>
                <Button
                    dataTid='quiz-next-question'
                    onClick={onNextClick}
                    disabled={isNextButtonDisabled}
                    isLoading={isNextButtonLoading}
                    className={nextButtonClassName}
                >
                    {nextButtonText ?? getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                </Button>
            </div>
        </div>
    );
};

export default observer(QuestionFooter);
