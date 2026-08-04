import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import SvgCross from 'frontend/components/icons-new/Cross';
import SvgDeleteFilled from 'frontend/components/icons-new/DeleteFilled';
import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './EditToolbar.module.scss';

export interface IEditToolbarProps {
    SelectedHolidaysPluralLabel?: ISitecoreField<string>;
    SelectedHolidaysSingularLabel?: ISitecoreField<string>;
}

const EditToolbar: FC<IEditToolbarProps> = ({ SelectedHolidaysPluralLabel, SelectedHolidaysSingularLabel }) => {
    const { getPhrase, selectedOffers, cancelEditMode, toggleRemovePopup } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        selectedOffers: stores.shortlistStore.selectedOffers,
        cancelEditMode: stores.shortlistStore.cancelEditMode,
        toggleRemovePopup: stores.shortlistStore.toggleRemovePopup,
    }));

    const isMobile = useMobileViewport();

    const totalSelectedOffers = selectedOffers?.length || 0;
    const label = totalSelectedOffers > 1 ? SelectedHolidaysPluralLabel : SelectedHolidaysSingularLabel;

    return (
        <div className={styles.wrapper}>
            <div className={styles.status}>
                {totalSelectedOffers > 0 && (
                    <span className={styles.icon}>
                        <SvgTick />
                    </span>
                )}
                <span className={styles.counter}>{selectedOffers?.length || 0}</span>
                {!isMobile && <Text field={label} />}
            </div>
            <div className={styles.actions}>
                <Button
                    isText
                    isMedium={!isMobile}
                    isSmall={isMobile}
                    disabled={!totalSelectedOffers}
                    onClick={() => totalSelectedOffers && toggleRemovePopup(true)}
                    id='shortlistRemoveBtn'
                    className={styles.removeButton}
                >
                    <SvgDeleteFilled />
                    {getPhrase(SitecoreDictionary.GlobalsButtonsRemove)}
                </Button>
                <Button
                    isText
                    isSmall={isMobile}
                    isMedium={!isMobile}
                    onClick={cancelEditMode}
                    id='shortlistCancelBtn'
                    className={styles.cancelButton}
                >
                    <SvgCross />
                    {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                </Button>
            </div>
        </div>
    );
};

export default observer(EditToolbar);
