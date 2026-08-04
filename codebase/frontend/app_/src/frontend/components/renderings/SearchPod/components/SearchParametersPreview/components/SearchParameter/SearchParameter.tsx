import React, { FC, ReactElement } from 'react';
import classNames from 'classnames';

import Button from 'frontend/components/common/Button';
import styles from 'frontend/components/renderings/SearchPod/components/SearchParametersPreview/components/SearchParameter/SearchParameter.module.scss';

export interface ISearchParameterProps {
    icon: ReactElement;
    onClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
    title: string;
    value: string;
    boldOnMobile?: boolean;
    valueClassName?: string;
    valueDataTid?: string;
}

const SearchParameter: FC<ISearchParameterProps> = props => (
    <Button removeDefaultClass className={styles.button} onClick={props.onClick} dataTid='search-parameter'>
        <div className={styles.label}>
            <div className={styles.title}>
                {props.icon}
                {props.title}
            </div>
            <div
                className={classNames(styles.value, props.valueClassName, {
                    [styles.bold]: props.boldOnMobile,
                })}
                data-tid={props.valueDataTid}
            >
                {props.value}
            </div>
        </div>
    </Button>
);

export default SearchParameter;
