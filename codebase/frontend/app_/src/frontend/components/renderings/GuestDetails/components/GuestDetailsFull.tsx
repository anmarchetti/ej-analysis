import { observer } from 'mobx-react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import styles from 'frontend/components/renderings/GuestDetails/GuestDetails.module.scss';
import { IGuestPageFields } from 'frontend/components/renderings/GuestDetails/GuestDetails.utils';

import { GuestDetailsConfirmation } from './GuestDetailsConfirmation';
import useGuestDetailsFull from './GuestDetailsFull.utils';
import GuestSection from './GuestSection';
import SpecialOffersBlock from './SpecialOffersBlock';

interface IGuestDetailsFullProps {
    fields: IGuestPageFields | undefined;
}

export const GuestDetailsFull: React.FC<IGuestDetailsFullProps> = ({ fields }) => {
    const {
        fatalError,
        adults,
        children,
        infants,
        getPhrase,
        nonFatalError,
        isSpecialOffersShown,
        isOffersOptedIn,
        isPartnerOffersOptedIn,
        forceErrors,
        changeOffersAndUpdates,
        onClick,
        hasDisabledStyles,
        ignoreAnimation,
    } = useGuestDetailsFull({
        fields,
    });

    return (
        <>
            {fatalError}

            <div className={styles.container}>
                {adults?.map((el, id) => (
                    <GuestSection
                        guestDetails={el}
                        id={+id + 1}
                        key={`adult-section-${+id}`}
                        fields={fields}
                        isLead={el.isLead}
                        ignoreAnimation={ignoreAnimation}
                    />
                ))}

                {children?.map((el, id) => (
                    <GuestSection
                        guestDetails={el}
                        id={+id + 1}
                        key={`children-section-${+id}`}
                        fields={fields}
                        ignoreAnimation={ignoreAnimation}
                    />
                ))}

                {infants?.map((el, id) => (
                    <GuestSection
                        guestDetails={el}
                        id={+id + 1}
                        key={`infant-section-${+id}`}
                        fields={fields}
                        ignoreAnimation={ignoreAnimation}
                    />
                ))}
            </div>

            {isSpecialOffersShown ? (
                <div className={styles.specialOffersWrapper}>
                    <SpecialOffersBlock
                        fields={fields!}
                        isOffersOptedIn={isOffersOptedIn}
                        isPartnerOffersOptedIn={isPartnerOffersOptedIn}
                        forceErrors={forceErrors}
                        changeOffersAndUpdates={(field, value): void => changeOffersAndUpdates?.(field, value)}
                    />
                </div>
            ) : (
                <p>{getPhrase(SitecoreDictionary.GuestDetailsTitlesNoMarketingPreferences)}</p>
            )}

            <GuestDetailsConfirmation fields={fields} />

            {nonFatalError}

            <div className='continue-button'>
                <Button
                    onClick={onClick}
                    isLarge
                    isFullWidth
                    hasDisabledStyles={hasDisabledStyles}
                    className='fs-18'
                    type='button'
                    data-tid='continue-button'
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                </Button>
            </div>
        </>
    );
};

export default observer(GuestDetailsFull);
