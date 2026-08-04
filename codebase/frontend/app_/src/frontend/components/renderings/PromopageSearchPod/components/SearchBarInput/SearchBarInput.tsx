import React, { ChangeEvent, FC } from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SVGCross from 'frontend/components/icons-new/Cross';

import styles from './SearchBarInput.module.scss';

export interface ISearchBarInputProps {
    hidePlaceholder: boolean;
    icon: any;
    id: string;
    isEditable: boolean;
    label: string;
    placeholder: string;
    showClearButton: boolean;
    value: string;
    ariaDescription?: string;
    isError?: boolean;
    isHighlighted?: boolean;
    onClearButtonClick?: () => void;
    onType?: (value: string) => void;
    sbInputKeyboardEvent?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    tabIndex?: number;
    toggleFocus?: (isFocused: boolean, event: React.FocusEvent<HTMLInputElement>) => void;
}

const SearchBarInput: FC<ISearchBarInputProps> = ({
    hidePlaceholder,
    icon,
    id,
    isEditable,
    label,
    placeholder,
    showClearButton,
    value,
    ariaDescription,
    isError,
    onClearButtonClick,
    onType,
    sbInputKeyboardEvent,
    tabIndex,
    toggleFocus,
    isHighlighted,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMobile = useMobileViewport();

    const focusHandler = (isFocus: boolean, event: React.FocusEvent<HTMLInputElement>): void => {
        toggleFocus?.(isFocus, event);
    };

    const clearButtonHandler = (): void => {
        onClearButtonClick?.();
    };

    return (
        <div
            className={classNames('search-bar__input-box', styles.inputBox, isHighlighted && styles.highlighted)}
            data-tid='search-bar-input'
        >
            <div
                className={classNames('form-field', {
                    [styles.errorInput]: isError,
                })}
                data-tid='search-bar-input-inner'
            >
                <div data-tid='input-wrapper'>
                    <input
                        id={id}
                        type='text'
                        className={styles.input}
                        autoComplete='off' // DONT CHANGE THIS VALUES. IF YOU WANT TO CHANGE THIS THEN DISCUSS IT WITH TEAM
                        aria-describedby={ariaDescription ? id + '-descr' : undefined}
                        value={value}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void => onType?.(e.target.value)}
                        readOnly={!isEditable}
                        onFocus={(event): void => focusHandler(true, event)}
                        onBlur={(event): void => focusHandler(false, event)}
                        onKeyDown={sbInputKeyboardEvent}
                        tabIndex={tabIndex}
                        data-tid={id}
                        data-input={true} // required attribute for flatpicker
                    />

                    {ariaDescription && (
                        <div id={id + '-descr'} className='visually-hidden'>
                            {ariaDescription}
                        </div>
                    )}

                    {!hidePlaceholder && (
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
                {showClearButton && value && !isMobile && (
                    <button
                        type='button'
                        className={styles.crossButton}
                        onClick={clearButtonHandler}
                        tabIndex={tabIndex}
                        aria-label={Tokenizer.replaceToken(
                            getPhrase(SitecoreDictionary.GlobalsButtonsClearField),
                            Tokens.Name,
                            `"${label}"`,
                        )}
                        data-tid='search-bar-input-cross'
                    >
                        <SVGCross />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBarInput;
