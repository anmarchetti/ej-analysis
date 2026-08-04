import { FC } from 'react';
import classNames from 'classnames';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';

import styles from './ComparePriceFooter.module.scss';

export interface IComparePriceFooterProps extends IComponentWithDictionary {
    confirmButtonText: string;
    disabled: boolean;
    isCancelTransparent: boolean;
    isDisabled: boolean;
    onCancel: () => void;
    onClick: () => void;
}

export const ComparePriceFooter: FC<IComparePriceFooterProps> = ({
    isCancelTransparent,
    onCancel,
    getPhrase,
    confirmButtonText,
    ...props
}) => (
    <div className={classNames(styles.footer)}>
        <div className={styles.buttonWrapper}>
            <Button
                dataTid='cancel-button'
                className={styles.cancel}
                isTransparent={isCancelTransparent}
                onClick={onCancel}
            >
                {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
            </Button>
        </div>

        <div className={styles.buttonWrapper}>
            <Button dataTid='confirm-button' className={styles.confirm} {...props}>
                {confirmButtonText}
            </Button>
        </div>
    </div>
);

export default ComparePriceFooter;
