import React, { FC } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isBookingFlow } from 'frontend/utils/buildSitecorePath';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';

import styles from './AfterResetMessage.module.scss';

export interface IAfterResetMessageProps {
    email: string;
    onClosePopup: () => void;
    afterReset?: (email: string) => void;
}

export const AfterResetMessage: FC<IAfterResetMessageProps> = ({ afterReset, email, onClosePopup }) => {
    const { getPhrase } = useStore(({ layoutStore }: IHolidaysStores) => ({
        getPhrase: layoutStore.getPhrase,
    }));

    const onLogInClick = (): void => {
        onClosePopup();
        afterReset?.(email);
    };

    return (
        <div data-tid='password-reset-popup'>
            <div className={styles.mainText} data-tid='email-sent-msg'>
                {Tokenizer.replaceToken(
                    getPhrase(SitecoreDictionary.LoginDescriptionsWeSentAnEmailTo),
                    Tokens.Email,
                    email,
                )}
            </div>

            <div className={styles.additionalText} data-tid='email-sent-additional-msg'>
                {isBookingFlow(location.search)
                    ? getPhrase(SitecoreDictionary.LoginDescriptionsNotificationInsideTheBookingFlow)
                    : getPhrase(SitecoreDictionary.LoginDescriptionsNotificationOutsideTheBookingFlow)}
            </div>

            <Button isText onClick={onLogInClick} dataTid='log-in-btn'>
                {getPhrase(SitecoreDictionary.LoginButtonsIHaveUpdatedPassword)}
            </Button>
        </div>
    );
};

export default AfterResetMessage;
