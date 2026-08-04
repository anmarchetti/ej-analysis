import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import roomAllocationGroupStyles from 'frontend/components/common/RoomAllocationGroup/RoomAllocationGroup.module.scss';
import SvgMinus from 'frontend/components/icons-new/Minus';
import SvgPlus from 'frontend/components/icons-new/Plus';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import styles from './RoomAllocationGuestsNumber.module.scss';

export interface IRoomAllocationGuestsNumberProps {
    errorMsgs: string[];
    hideErrors: boolean;
    icon: any;
    isAddDisabled: boolean;
    isRemoveDisabled: boolean;
    number: number;
    onAdd: () => void;
    onRemove: () => void;
    title: string;
    id?: string;
    selectorRef?: React.RefObject<HTMLDivElement>;
}

const RoomAllocationGuestsNumber: FC<IRoomAllocationGuestsNumberProps> = ({
    errorMsgs,
    hideErrors,
    icon,
    isAddDisabled,
    isRemoveDisabled,
    number,
    onAdd,
    onRemove,
    title,
    id,
    selectorRef,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({ getPhrase: stores.layoutStore.getPhrase }));

    return (
        <div id={id} ref={selectorRef}>
            <div
                className={classNames('num-control', styles.numControl, {
                    [styles.error]: errorMsgs.length > 0 && !hideErrors,
                })}
            >
                <div className={styles.label}>
                    {icon}

                    <span className={styles.description} data-tid='room-allocation-title'>
                        {title}
                    </span>
                </div>
                <div className={classNames(styles.numControls, 'num-controls')}>
                    <button
                        data-tid='remove'
                        type='button'
                        className={classNames('btn-round num-dec', { 'btn-round--grey': isRemoveDisabled })}
                        onClick={onRemove}
                        aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsNumberOfGuestsMinus)}
                    >
                        <SvgMinus />
                    </button>

                    <input
                        type='number'
                        value={number}
                        min='0'
                        max='999'
                        data-tid='guest-picker-value'
                        readOnly
                        tabIndex={-1}
                    />

                    <button
                        data-tid='add'
                        type='button'
                        className={classNames('btn-round num-inc', { 'btn-round--grey': isAddDisabled })}
                        onClick={onAdd}
                        aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsNumberOfGuestsPlus)}
                    >
                        <SvgPlus />
                    </button>
                </div>
            </div>

            {!hideErrors &&
                errorMsgs.map((msg, i) => (
                    <ErrorMessage
                        key={i}
                        message={<RichTextWithLinks field={{ value: msg }} tag='span' />}
                        errorMessageClass={classNames(roomAllocationGroupStyles.errorMessage, styles.errorMessage)}
                        icon={
                            <i className='error-message__icon'>
                                <SvgWarningFilled />
                            </i>
                        }
                        IsDesc
                    />
                ))}
        </div>
    );
};

export default RoomAllocationGuestsNumber;
