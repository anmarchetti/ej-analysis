import React, { FC, ReactNode, useEffect, useRef } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import Button from 'frontend/components/common/Button';
import SvgEditFilled from 'frontend/components/icons-new/EditFilled';
import SvgCompareIcon from 'frontend/components/icons-new/SvgCompareIcon';
import { useCompareStore } from 'frontend/components/renderings/CompareDeals/stores/createCompareLocalStore';
import { IShortlistsSitecoreFields } from 'frontend/components/renderings/Shortlists/interfaces';

import EditToolbar from './components/EditToolbar/EditToolbar';

import styles from './ShortlistToolbar.module.scss';

export interface IShortlistToolbarProps {
    fields: IShortlistsSitecoreFields;
    rendering: any;
}

const ShortlistToolbar: FC<IShortlistToolbarProps> = ({ fields, rendering }) => {
    const { isShortlistEditMode, startEditMode } = useStore((stores: IHolidaysStores) => ({
        isShortlistEditMode: stores.shortlistStore.isShortlistEditMode,
        startEditMode: stores.shortlistStore.startEditMode,
    }));

    const { isCompareModeEnabled, activateCompareMode, compareDealsFields } = useCompareStore();

    const ref = useRef<HTMLDivElement | null>(null);
    const isMobile = useMobileViewport();

    useEffect(() => {
        updateBodyPadding();

        return () => {
            updateBodyPadding(false);
        };
    }, []);

    // Add bottom offset to body. It allows to scroll to the bottom of the page.
    const updateBodyPadding = (isToolbarVisible: boolean = true): void => {
        document.body.style.paddingBottom = isToolbarVisible ? `${ref?.current?.offsetHeight || 0}px` : '';
    };

    return (
        <div className={styles.wrapper} ref={ref}>
            {isShortlistEditMode && (
                <div className={styles.background}>
                    <div className={styles.content} data-tid='shortlist-edit-toolbar'>
                        <EditToolbar
                            SelectedHolidaysPluralLabel={fields?.SelectedHolidaysPluralLabel}
                            SelectedHolidaysSingularLabel={fields?.SelectedHolidaysSingularLabel}
                        />
                    </div>
                </div>
            )}

            <Placeholder
                name={PlaceholderNames.CompareDeals}
                rendering={rendering}
                render={(components: ReactNode[]): ReactNode => (
                    <div className={classNames(isCompareModeEnabled && styles.compareModeActive, styles.compareMode)}>
                        {components}
                    </div>
                )}
            />

            {!isShortlistEditMode && !isCompareModeEnabled && (
                <div className={styles.background}>
                    <div className={styles.content}>
                        <div className={styles.actions}>
                            <Button
                                isOutlined
                                isMedium={!isMobile}
                                isSmall={isMobile}
                                onClick={startEditMode}
                                id='shortlistEditBtn'
                                dataTid='shortlist-edit-button'
                                className={styles.editButton}
                            >
                                <SvgEditFilled />
                                {fields.EditListCTA.value}
                            </Button>
                            <Button
                                dataTid='compare-shortlist-button'
                                isMedium={!isMobile}
                                isSmall={isMobile}
                                onClick={activateCompareMode}
                                className={styles.compareBtn}
                            >
                                <SvgCompareIcon />
                                {isMobile
                                    ? compareDealsFields?.CompareMobileCTA.value
                                    : compareDealsFields?.CompareCTA.value}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default observer(ShortlistToolbar);
