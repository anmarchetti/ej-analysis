import classNames from 'classnames';
import { observer } from 'mobx-react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import EmailVerificationSection from './components/EmailVerificationSection';
import GuestDetailsFull from './components/GuestDetailsFull';
import GuestDetailsSkeleton from './components/GuestDetailsSkeleton';
import GuestPageInformation from './components/GuestPageInformation';
import useGuestDetails, { IGuestPageFields } from './GuestDetails.utils';

import styles from './GuestDetails.module.scss';

export type TGuestDetailsProps = ISitecoreComponent<IGuestPageFields>;

export const GuestDetails: React.FC<TGuestDetailsProps> = ({ fields }) => {
    const {
        isDisplayed,
        pageTitle,
        isAdvanced,
        isHolidaysLoading,
        isEmailVerificationShown,
        isGuestsInfoShown,
        isPageTitleVisible,
        isTradePortal,
        hasSignInPrompt,
    } = useGuestDetails({ fields });

    if (!isDisplayed) return null;

    return (
        <div
            data-tid='guest-details-container'
            className={classNames(styles.wrapper, {
                [styles.advanced]: isAdvanced,
            })}
        >
            {isPageTitleVisible && pageTitle && <h1 className='page-title'>{pageTitle}</h1>}

            <GuestPageInformation fields={fields} isTradePortal={isTradePortal} />

            {isHolidaysLoading && <GuestDetailsSkeleton />}

            {isEmailVerificationShown && <EmailVerificationSection hasSignInPrompt={hasSignInPrompt} />}

            {isGuestsInfoShown && <GuestDetailsFull fields={fields} />}
        </div>
    );
};

export default observer(GuestDetails);
