import React from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import styles from './GraphNavigation.module.scss';

interface IGraphNavigationButtonProps {
    dataTid: string;
    icon: JSX.Element;
    isDisabled: boolean;
    label: SitecoreDictionary;
    onClick: () => void;
    btnClass?: string;
}

const GraphNavigationButton = ({
    onClick,
    isDisabled,
    dataTid,
    btnClass,
    label,
    icon,
}: IGraphNavigationButtonProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <button
            className={classNames(btnClass, styles.button, isDisabled && styles.disabled)}
            disabled={isDisabled}
            onClick={onClick}
            aria-label={getPhrase(label)}
            data-tid={dataTid}
        >
            {icon}
        </button>
    );
};

export default GraphNavigationButton;
