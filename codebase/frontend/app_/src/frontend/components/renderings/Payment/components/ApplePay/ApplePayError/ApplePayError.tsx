import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SvgApplePayError from 'frontend/components/icons-new/ApplePayError';

import styles from './ApplePayError.module.scss';

const ApplePayError: React.FC = () => {
    const { payStore, getPhrase } = useStore((stores: IHolidaysStores) => ({
        payStore: stores.payStore,
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const error = payStore.applePayValidationError;

    if (!error) return null;

    return (
        <div className={styles.errorContainer}>
            <SvgApplePayError />
            <span className={styles.errorText}>{getPhrase(error.descriptionKey)}</span>
        </div>
    );
};

export default observer(ApplePayError);
