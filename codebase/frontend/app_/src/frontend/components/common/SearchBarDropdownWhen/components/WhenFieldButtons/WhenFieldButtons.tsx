import React, { FC, ReactElement, RefObject } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TWO } from 'code/commonNumbers';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';

import styles from './WhenFieldButtons.module.scss';

export interface IWhenFieldButtonsProps {
    clearDate: (noJump?: boolean) => void;
    nightsNum: number;
    nightsSelectedLabel: Nullable<string>;
    onApply: () => void;
    onCloseClick: () => void;
    value: Date[];
    applyBtnText?: string;
    ignoreIsPromoPage?: boolean;
    isApplyDisabled?: boolean;
    refCalendarClear?: RefObject<HTMLButtonElement>;
    refCalendarClose?: RefObject<HTMLButtonElement>;
    renderError?: () => ReactElement | null;
}

const WhenFieldButtons: FC<IWhenFieldButtonsProps> = props => {
    const { getPhrase, setSearchPerformWithNewParams, isPromoPage } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        setSearchPerformWithNewParams: stores.searchStore.setSeachPerformWithNewParams,
        isPromoPage: stores.layoutStore.isPromoPage,
    }));

    const isMobile = useMobileViewport();
    const isDateRangeSelected = props.value.length === TWO;
    const isFromDateSelected = props.value.length > 0;

    const dropdownClearHandler = (): void => {
        props.clearDate();
    };

    const dropdownApplyHandler = (): void => {
        if (isDateRangeSelected) {
            props.onApply();

            if (isPromoPage && !props.ignoreIsPromoPage) {
                setSearchPerformWithNewParams(true);
            }
        } else if (props.isApplyDisabled) {
            props.onApply();
        }
    };

    return (
        <div className='search-bar__dropdown-wrapper search-bar__dropdown-wrapper-btns'>
            {isMobile && props.renderError?.()}
            <div className='search-bar__dropdown-btns search-bar__dropdown-btns--clear'>
                <Button
                    isTransparent
                    isText
                    className={classNames('search-bar__dropdown-clear', styles.clearButton, {
                        [styles.shown]: isFromDateSelected,
                    })}
                    onClick={dropdownClearHandler}
                    ref={props.refCalendarClear}
                    dataTid='clear-selection'
                >
                    {getPhrase(SitecoreDictionary.GlobalsLabelsClearSelection)}
                </Button>
                <span
                    className={classNames('slected-nights', styles.nightsLabel, {
                        [styles.shown]: props.nightsNum > 0,
                    })}
                >
                    {props.nightsSelectedLabel}
                </span>
            </div>

            <div className='search-bar__dropdown-btns search-bar__dropdown-btns--set'>
                <Button
                    isTransparent
                    className='search-bar__dropdown-close'
                    onClick={props.onCloseClick}
                    ref={props.refCalendarClose}
                    dataTid='close-selection'
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>{' '}
                <Button
                    className={classNames(styles.applyButton)}
                    onClick={dropdownApplyHandler}
                    disabled={props.isApplyDisabled ? false : !isDateRangeSelected}
                    hasDisabledStyles={props.isApplyDisabled || !isDateRangeSelected}
                    dataTid='apply-selection'
                >
                    {props.applyBtnText ? props.applyBtnText : getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                </Button>
            </div>
        </div>
    );
};

export default observer(WhenFieldButtons);
