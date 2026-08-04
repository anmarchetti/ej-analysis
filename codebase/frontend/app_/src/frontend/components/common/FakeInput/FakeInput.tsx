import React, { FC } from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SVGCross from 'frontend/components/icons-new/Cross';

import styles from './FakeInput.module.scss';

export interface IFakeInputProps {
    id: string;
    placeholder: string;
    showClearButton: boolean;
    value: string;
    highlightWhenFull?: boolean;
    label?: string;
    onClearButtonClick?: () => void;
    onClick?: () => void;
    onClickButton?: () => void;
    placeholderIcon?: JSX.Element;
    staticIcon?: JSX.Element;
    tabIndex?: number;
}

const FakeInput: FC<IFakeInputProps> = ({
    placeholderIcon,
    id,
    label,
    placeholder,
    showClearButton,
    value,
    onClearButtonClick,
    onClickButton,
    onClick,
    tabIndex,
    highlightWhenFull,
    staticIcon,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMobile = useMobileViewport();

    const clearButtonHandler = (): void => {
        onClearButtonClick?.();
    };

    return (
        <div className={classNames('search-bar__input-box', styles.inputBox)} data-tid='fake-input'>
            <div
                className={classNames('form-field', {
                    [`search-bar__field--with-button ${styles.withButtons}`]: onClickButton,
                    [`form-field--in-progress ${styles.inProgress}`]: !!value && highlightWhenFull,
                })}
                data-tid='fake-input-inner'
            >
                <div data-tid='fake-input-wrapper'>
                    <input
                        id={id}
                        type='text'
                        className={classNames('form-control__input', styles.input)}
                        autoComplete='off' // DONT CHANGE THIS VALUES. IF YOU WANT TO CHANGE THIS THEN DISCUSS IT WITH TEAM
                        value={value}
                        readOnly={true}
                        onClick={onClick}
                        tabIndex={tabIndex}
                        data-tid={id}
                        data-input={true} // required attribute for flatpicker
                    />

                    {staticIcon && <span className={styles.staticIcon}>{staticIcon}</span>}

                    {!value && (
                        <span className={classNames('form-control__placeholder', styles.placeholder)}>
                            {placeholderIcon}

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
                        className={classNames(styles.crossButton)}
                        onClick={clearButtonHandler}
                        tabIndex={tabIndex}
                        aria-label={Tokenizer.replaceToken(
                            getPhrase(SitecoreDictionary.GlobalsButtonsClearField),
                            Tokens.Name,
                            label,
                        )}
                        data-tid='input-cross'
                    >
                        <SVGCross />
                    </button>
                )}
            </div>
        </div>
    );
};

export default FakeInput;
