import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IGuestPageFields } from 'frontend/components/renderings/GuestDetails/GuestDetails.utils';

import styles from './GuestPageInformation.module.scss';

interface IGuestPageInformationProps {
    fields?: IGuestPageFields;
    isTradePortal?: boolean;
}

const GuestPageInformation: React.FC<IGuestPageInformationProps> = ({ fields, isTradePortal }) => {
    if (!fields) return null;

    return (
        <div className={classNames(styles.wrapper, { [styles.trade]: isTradePortal })}>
            {!!fields.GuestInformationTitle?.value && (
                <Text field={fields.GuestInformationTitle} tag='h3' className={styles.title} />
            )}
            {!!fields.GuestInformationDescription?.value && (
                <Text field={fields.GuestInformationDescription} tag='p' className={styles.subtitle} />
            )}
        </div>
    );
};

export default GuestPageInformation;
