import { FC } from 'react';
import classNames from 'classnames';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import styles from './ContactFormFieldset.module.scss';

export interface IContactFromFieldsetProps {
    children: React.ReactNode;
    className?: string;
    title?: ISitecoreField<string>;
    titleTid?: string;
}

export const ContactFromFieldset: FC<IContactFromFieldsetProps> = ({ title, titleTid, children, className }) => (
    <fieldset className={classNames(styles.fieldset, className)}>
        {!!title?.value && (
            <legend className={styles.formSectionTitle} data-tid={titleTid}>
                {title.value}
            </legend>
        )}
        {children}
    </fieldset>
);

export default ContactFromFieldset;
