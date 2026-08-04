import React, { ChangeEvent, FC, KeyboardEvent, MutableRefObject } from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SVGCross from 'frontend/components/icons-new/Cross';
import SVGList from 'frontend/components/icons-new/List';
import styles from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SBInput/SBInput.module.scss';

export const LIST_BUTTON_CLASS_FOR_CALCULATION = 'button-list';
export const CROSS_BUTTON_CLASS_FOR_CALCULATION = 'button-cross';

export interface ISearchBarInputProps {
    id: string;
    isEditable: boolean;
    label: string;
    showClearButton: boolean;
    value: string;
    ariaDescription?: string;
    ariaLabel?: string;
    clickOnListButton?: () => void;
    dropdownToggleLabel?: string;
    hidePlaceholder?: boolean;
    icon?: JSX.Element;
    inputRef?: MutableRefObject<HTMLInputElement | null>;
    isError?: boolean;
    isInputHighlighted?: boolean;
    onClearButtonClick?: () => void;
    onClick?: () => void;
    onFocus?: () => void;
    onInputBlur?: () => void;
    onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
    onType?: (value: string) => void;
    placeholder?: string;
    tabIndex?: number;
}

const SBInput: FC<ISearchBarInputProps> = ({
    hidePlaceholder,
    icon,
    id,
    isEditable,
    label,
    placeholder,
    showClearButton,
    value,
    ariaDescription,
    ariaLabel,
    dropdownToggleLabel,
    isError,
    onClearButtonClick,
    clickOnListButton,
    onType,
    tabIndex,
    onFocus,
    onKeyDown,
    isInputHighlighted,
    inputRef,
    onClick,
    onInputBlur,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const clearButtonHandler = (): void => {
        onClearButtonClick?.();
    };

    const ariaDescriptionId = ariaDescription ? id + '-descr' : undefined;
    const isPlaceholderShown = !hidePlaceholder && placeholder;

    return (
        <div className={classNames('search-bar__input-box', styles.inputBox)} data-tid='search-bar-input'>
            <div
                className={classNames('form-field', {
                    [`search-bar__field--with-button ${styles.withButtons}`]: clickOnListButton,
                    [`form-field--in-progress ${styles.inProgress}`]: isInputHighlighted,
                    'form-field--error': isError,
                })}
                data-tid='search-bar-input-inner'
            >
                <div data-tid='input-wrapper'>
                    <input
                        id={id}
                        type='text'
                        className={classNames('form-control__input', styles.input, isPlaceholderShown && styles.gap)}
                        autoComplete='off' // DONT CHANGE THIS VALUES. IF YOU WANT TO CHANGE THIS THEN DISCUSS IT WITH TEAM
                        ref={inputRef}
                        aria-label={ariaLabel}
                        aria-describedby={ariaDescriptionId}
                        value={value}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void => onType?.(e.target.value)}
                        readOnly={!isEditable}
                        onKeyDown={onKeyDown}
                        tabIndex={tabIndex}
                        data-tid={id}
                        data-input={true} // required attribute for flatpicker
                        onFocus={onFocus}
                        onClick={onClick}
                        onBlur={onInputBlur}
                    />

                    {ariaDescription && (
                        <div id={ariaDescriptionId} className='visually-hidden'>
                            {ariaDescription}
                        </div>
                    )}

                    {isPlaceholderShown && (
                        <span className={classNames('form-control__placeholder', styles.placeholder)}>
                            {icon}

                            <span>{placeholder}</span>
                        </span>
                    )}

                    <label className={classNames(styles.label, 'form-control__label')} data-for={id} htmlFor={id}>
                        {label}
                    </label>
                </div>
            </div>
            <div className={classNames('search-bar__buttons-container', styles.buttonsContainer)}>
                {showClearButton && value && (
                    <button
                        type='button'
                        className={classNames(styles.crossButton, CROSS_BUTTON_CLASS_FOR_CALCULATION)}
                        onClick={clearButtonHandler}
                        tabIndex={tabIndex}
                        aria-label={Tokenizer.replaceToken(
                            getPhrase(SitecoreDictionary.GlobalsButtonsClearField),
                            Tokens.Name,
                            ariaLabel || label,
                        )}
                        data-tid='search-bar-input-cross'
                    >
                        <SVGCross />
                    </button>
                )}
                {clickOnListButton && (
                    <button
                        type='button'
                        className={classNames(styles.listButton, LIST_BUTTON_CLASS_FOR_CALCULATION)}
                        onClick={clickOnListButton}
                        tabIndex={tabIndex}
                        aria-haspopup='dialog'
                        aria-label={dropdownToggleLabel}
                        data-tid='search-bar-input-list'
                    >
                        <SVGList />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SBInput;
