'use client';
import React, { FC } from 'react';
import classNames from 'classnames';
import { useRouter } from 'next/router';

import useStore from 'frontend/hooks/useStore';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';

import styles from './MobileBackButton.module.scss';

interface IMobileBackButtonProps {
    buttonText?: string;
    className?: string;
}

const MobileBackButton: FC<IMobileBackButtonProps> = ({ className, buttonText }) => {
    const router = useRouter();
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const backUrl = router.query[QueryParamName.BackUrl];
    const backButtonText = router.query[QueryParamName.BackButtonText];

    const backButtonTextValue = backButtonText
        ? decodeURIComponent(String(backButtonText))
        : buttonText || getPhrase(SitecoreDictionary.GlobalsButtonsBack);

    if (!backUrl) {
        return null;
    }

    const handleBackClick = (): void => {
        globalThis.location.href = String(backUrl);
    };

    return (
        <div className={classNames(styles.container, className)} data-tid='mobile-back-button-container'>
            <Button onClick={handleBackClick} isTransparent isFullWidth dataTid='mobile-back-button'>
                {backButtonTextValue}
            </Button>
        </div>
    );
};

export default MobileBackButton;
