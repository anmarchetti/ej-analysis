import React, { FC, useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { removeSpacesFromString } from 'frontend/utils/string.utils';
import { getShortlistOfferIdentifier } from 'frontend/utils/tracking/comparisonTable.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { disableScroll, enableScroll } from 'frontend/utils/ui.utils';
import { IComparisonTableFields } from 'models/data/IComparison';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgDeleteFilled from 'frontend/components/icons-new/DeleteFilled';

import ComparisonTable from './components/ComparisonTable/ComparisonTable';
import { useCompareStore } from './stores/createCompareLocalStore';

import styles from './CompareDeals.module.scss';

export interface ICompareDealsFields extends IComparisonTableFields {
    CancelCompareButton: ISitecoreField<string>;
    CompareCTA: ISitecoreField<string>;
    CompareLabel: ISitecoreField<string>;
    CompareMobileCTA: ISitecoreField<string>;
    SelectedHolidaysLabel: ISitecoreField<string>;
    ViewCompareButton: ISitecoreField<string>;
}

export type TCompareDealsProps = ISitecoreComponent<ICompareDealsFields>;

const CompareDeals: FC<TCompareDealsProps> = ({ fields }) => {
    const { getPhrase, trackEventWithParams, sitePath, isSearchPerformWithNewParams, pageTitle, pageLang } = useStore(
        (stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            trackEventWithParams: stores.trackingStore.trackEventWithParams,
            sitePath: stores.layoutStore.sitePath,
            isSearchPerformWithNewParams: stores.searchStore.isSeachPerformWithNewParams,
            pageTitle: stores.trackingStore.pageTitle,
            pageLang: stores.trackingStore.pageLang,
        }),
    );

    const {
        comparisonListLength,
        deactivateCompareMode,
        hasMaxItemsToCompare,
        clearComparisonList,
        hasMinItemsToCompare,
        isCompareOverlayOpened,
        closeCompareOverlay,
        openCompareOverlay,
        comparisonList,
        setCompareDealsFields,
        compareDealsMaxItemCount,
    } = useCompareStore();

    const isMobile = useMobileViewport();

    useEffect(() => {
        if (isSearchPerformWithNewParams) {
            deactivateCompareMode();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSearchPerformWithNewParams]);

    useEffect(() => {
        if (isCompareOverlayOpened) {
            disableScroll();
        } else {
            enableScroll();
        }

        return () => {
            enableScroll();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCompareOverlayOpened]);

    useEffect(() => {
        if (fields) {
            setCompareDealsFields(fields);
        }

        return () => {
            deactivateCompareMode();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!fields) {
        return null;
    }

    const { CancelCompareButton, SelectedHolidaysLabel, ViewCompareButton, ComparisonCriteria, FallbackLabel } = fields;

    const clearComparison = (): void => {
        closeCompareOverlay();
        clearComparisonList();
    };

    const onCompareButtonClick = async (): Promise<void> => {
        const page = removeSpacesFromString(pageTitle).toLowerCase();
        const customParams = generateGenericValues({
            genericValue1: getShortlistOfferIdentifier(comparisonList[0]),
            genericValue2: getShortlistOfferIdentifier(comparisonList[1]),
            genericValue3: getShortlistOfferIdentifier(comparisonList[2]),
            genericValue4: getShortlistOfferIdentifier(comparisonList[3]),
            destinationUrl: `${sitePath}/${page}${SitePath.Compare}`,
        });

        await trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Shortlist,
                eventAction: `${pageTitle} Compare|${pageLang}`,
                eventLabel: EventLabels.Compare,
                eventType: EventTypes.Interaction,
            },
            customParams,
        );

        openCompareOverlay();
    };

    return (
        <div className={classNames(styles.background, isCompareOverlayOpened && styles.coverBackground)}>
            <div className={classNames(styles.wrapper, isCompareOverlayOpened && styles.coverWrapper)}>
                <div className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.status}>
                            <span
                                className={classNames(styles.counter, hasMaxItemsToCompare && styles.full)}
                                data-tid='count-compared-offers'
                            >
                                {`${comparisonListLength}/${compareDealsMaxItemCount}`}
                            </span>
                            {!isMobile && (
                                <Text field={SelectedHolidaysLabel} tag={'span'} data-tid='selected-holidays-label' />
                            )}
                            {!!comparisonListLength && (
                                <Button
                                    isText
                                    className={styles.clearButton}
                                    isMedium={!isMobile}
                                    isSmall={isMobile}
                                    onClick={clearComparison}
                                    dataTid='clear-comparison-button'
                                >
                                    <SvgDeleteFilled />
                                    {!isMobile && getPhrase(SitecoreDictionary.GlobalsLabelsClearSelection)}
                                </Button>
                            )}
                        </div>

                        <div className={styles.actions}>
                            {!isCompareOverlayOpened && (
                                <>
                                    <Button
                                        isText
                                        isMedium={!isMobile}
                                        isSmall={isMobile}
                                        onClick={deactivateCompareMode}
                                        dataTid='cancel-compare-mode-button'
                                        className={styles.cancelCompare}
                                    >
                                        {isMobile
                                            ? getPhrase(SitecoreDictionary.GlobalsButtonsCancel)
                                            : CancelCompareButton.value}
                                    </Button>

                                    <Button
                                        isMedium={!isMobile}
                                        isSmall={isMobile}
                                        disabled={!hasMinItemsToCompare}
                                        dataTid='compare-button'
                                        onClick={onCompareButtonClick}
                                        className={styles.compareButton}
                                    >
                                        {isMobile
                                            ? getPhrase(SitecoreDictionary.GlobalsButtonsView)
                                            : ViewCompareButton.value}
                                    </Button>
                                </>
                            )}

                            {isCompareOverlayOpened && (
                                <Button
                                    isText
                                    isMedium={!isMobile}
                                    isSmall={isMobile}
                                    onClick={closeCompareOverlay}
                                    dataTid='close-compare-overlay'
                                    className={styles.closeOverlay}
                                >
                                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                                    <SvgChevronDown />
                                </Button>
                            )}
                        </div>
                    </div>

                    {isCompareOverlayOpened && (
                        <div className={styles.compareTable} data-tid='comparison-table-wrapper'>
                            <ComparisonTable ComparisonCriteria={ComparisonCriteria} FallbackLabel={FallbackLabel} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(CompareDeals);
