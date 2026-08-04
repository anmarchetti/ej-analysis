import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Checkbox from 'frontend/components/common/Checkbox';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ErrorMessage from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/ErrorMessage/ErrorMessage';

import styles from './ConfirmationCheckbox.module.scss';

export interface IConfirmationCheckboxProps {
    Description: ISitecoreField<string>;
    ErrorContent: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    checked: boolean;
    hasError: boolean;
    id: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ConfirmationCheckbox: React.FC<IConfirmationCheckboxProps> = ({
    checked,
    Title,
    hasError,
    onChange,
    Description,
    ErrorContent,
    id,
}) => (
    <div className={classNames(styles.container, hasError && styles.error)} data-tid='confirmation-checkbox'>
        <div className={styles.contentContainer}>
            <Checkbox
                id={id}
                textRight
                tick
                hasError={hasError}
                checked={checked}
                required
                onChange={onChange}
                dataTid={id}
                className={styles.checkbox}
            />
            <div className={styles.content}>
                <Text className={styles.title} field={Title} tag='div' />
                <RichTextWithLinks field={Description} className={styles.description} />
            </div>
        </div>
        {hasError && <ErrorMessage error={ErrorContent.value} />}
    </div>
);

export default ConfirmationCheckbox;
