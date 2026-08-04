import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SvgUserFilled from 'frontend/components/icons-new/UserFilled';

import GuestDetailsBlock from './section/GuestDetailsBlock';
import EmailVerification from './EmailVerification';

import styles from './GuestSection.module.scss';

interface IEmailVerificationSectionProps {
    hasSignInPrompt: boolean;
}

export const EmailVerificationSection: React.FC<IEmailVerificationSectionProps> = ({ hasSignInPrompt }) => {
    const { adults, children, infants, getPrimarySectionText, getSecondarySectionText } = useStore(
        (stores: IHolidaysStores) => ({
            adults: stores.guestDetailsStore.adults,
            children: stores.guestDetailsStore.children,
            infants: stores.guestDetailsStore.infants,
            getSecondarySectionText: stores.guestDetailsStore.getSecondarySectionText,
            getPrimarySectionText: stores.guestDetailsStore.getPrimarySectionText,
        }),
    );

    return (
        <div className={styles.section}>
            {adults.map((el, id) => (
                <GuestDetailsBlock
                    key={id}
                    id={`guest-details-${getPrimarySectionText(el)}-${id + 1}`}
                    title={`${getPrimarySectionText(el)} ${id + 1}`}
                    secondaryText={getSecondarySectionText(el)}
                    icon={<SvgUserFilled />}
                    isLead={el.isLead}
                    disabled={!el.isLead}
                >
                    <EmailVerification guest={el} hasSignInPrompt={hasSignInPrompt} />
                </GuestDetailsBlock>
            ))}

            {children.map((el, id) => (
                <GuestDetailsBlock
                    key={id}
                    id={`guest-details-${getPrimarySectionText(el)}-${id + 1}`}
                    title={`${getPrimarySectionText(el)} ${id + 1}`}
                    secondaryText={getSecondarySectionText(el)}
                    icon={<SvgUserFilled />}
                    disabled
                />
            ))}

            {infants.map((el, id) => (
                <GuestDetailsBlock
                    key={id}
                    id={`guest-details-${getPrimarySectionText(el)}-${id + 1}`}
                    title={`${getPrimarySectionText(el)} ${id + 1}`}
                    secondaryText={getSecondarySectionText(el)}
                    icon={<SvgUserFilled />}
                    disabled
                />
            ))}
        </div>
    );
};

export default observer(EmailVerificationSection);
