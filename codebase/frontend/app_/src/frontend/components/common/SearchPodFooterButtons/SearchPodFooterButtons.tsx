import React, { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { SearchBarDropdown, SearchBarDropdownFooterButton } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

import styles from './SearchPodFooterButtons.module.scss';

export interface ISearchPodFooterButtonsProps {
    applyButtonLabel: string;
    clearButtonLabel: string;
    isShownClearButton: boolean;
    onApplyClick: () => void;
    onClearClick: () => void;
    onCloseClick: () => void;
    fieldName?: SearchBarDropdown;
    isApplyButtonDisabled?: boolean;
    mobileLabel?: string;
}

const SearchPodFooterButtons: FC<ISearchPodFooterButtonsProps> = ({
    applyButtonLabel,
    clearButtonLabel,
    isShownClearButton,
    onApplyClick,
    onCloseClick,
    onClearClick,
    isApplyButtonDisabled,
    mobileLabel,
    fieldName,
}) => {
    const {
        getPhrase,
        trackFromFooterButtonsClick,
        trackToFooterButtonsClick,
        trackWhenFooterButtonsClick,
        trackWhoFooterButtonsClick,
    } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        trackFromFooterButtonsClick: stores.trackingStore.searchPod.trackFromFooterButtonsClick,
        trackToFooterButtonsClick: stores.trackingStore.searchPod.trackToFooterButtonsClick,
        trackWhenFooterButtonsClick: stores.trackingStore.searchPod.trackWhenFooterButtonsClick,
        trackWhoFooterButtonsClick: stores.trackingStore.searchPod.trackWhoFooterButtonsClick,
    }));

    const { isSearchPodInitialized } = useSearchPodStore() || {};

    const shouldTrack = isSearchPodInitialized && fieldName;

    const fieldTrackers: Partial<Record<SearchBarDropdown, (btn: SearchBarDropdownFooterButton) => void>> = {
        [SearchBarDropdown.From]: trackFromFooterButtonsClick,
        [SearchBarDropdown.To]: trackToFooterButtonsClick,
        [SearchBarDropdown.When]: trackWhenFooterButtonsClick,
        [SearchBarDropdown.Who]: trackWhoFooterButtonsClick,
    };

    const handleClearClick = (): void => {
        if (shouldTrack) {
            const tracker = fieldTrackers[fieldName];
            tracker?.(SearchBarDropdownFooterButton.Clear);
        }

        onClearClick();
    };

    const handleCloseClick = (): void => {
        if (shouldTrack) {
            const tracker = fieldTrackers[fieldName];
            tracker?.(SearchBarDropdownFooterButton.Close);
        }

        onCloseClick();
    };

    const handleApplyClick = (): void => {
        if (shouldTrack) {
            const tracker = fieldTrackers[fieldName];
            tracker?.(SearchBarDropdownFooterButton.Apply);
        }

        onApplyClick();
    };

    return (
        <div data-tid='search-pod-footer-buttons' className={styles.wrapper}>
            <div
                className={classNames(
                    styles.clearButtonWrapper,
                    isShownClearButton && styles.clearButtonWrapperVisible,
                )}
                data-tid='clear-button-wrapper'
            >
                <Button
                    isTransparent
                    isText
                    className={styles.clearButton}
                    onClick={handleClearClick}
                    dataTid='clear-button'
                >
                    {clearButtonLabel}
                </Button>
                <span className={styles.mobileLabel} data-tid='search-pod-footer-label'>
                    {mobileLabel}
                </span>
            </div>

            <div className={styles.rightButtons}>
                <Button isTransparent onClick={handleCloseClick} className={styles.button} dataTid='close-button'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
                <Button
                    onClick={handleApplyClick}
                    disabled={isApplyButtonDisabled}
                    className={classNames(styles.button, styles.applyButton)}
                    dataTid='apply-button'
                >
                    {applyButtonLabel}
                </Button>
            </div>
        </div>
    );
};

export default SearchPodFooterButtons;
