import { FC, memo } from 'react';

import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import styles from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/Inputs.module.scss';

const ErrorMessage: FC<{ error?: string; id?: string }> = ({ error, id }) => {
    if (!error) return null;

    return (
        <span className={styles.error} id={id} data-tid='error-message'>
            <SvgWarningFilled />
            <span>{error}</span>
        </span>
    );
};

export default memo(ErrorMessage);
