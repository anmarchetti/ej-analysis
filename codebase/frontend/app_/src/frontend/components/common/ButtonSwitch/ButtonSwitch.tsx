import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './ButtonSwitch.module.scss';

export interface IButtonSwitchItem {
    icon: ISitecoreField<ISitecoreImage>;
    key: string;
    name: ISitecoreField<string>;
}

export interface IButtonSwitchProps {
    activeIndex: number;
    items: IButtonSwitchItem[];
    onClick: (idx: number) => void;
    children?: JSX.Element;
}

const ButtonSwitch: FC<IButtonSwitchProps> = ({ activeIndex, items, onClick, children }) => (
    <div data-tid='button-switch-container' className={styles.container}>
        <div data-tid='button-switch-wrapper' className={styles.wrapper}>
            {items.map((item, index) => (
                <button
                    key={`switch-${item.name?.value}-${index}`}
                    className={classNames(styles.button, { [styles.active]: index === activeIndex })}
                    onClick={(): void => onClick(index)}
                    data-tid='button-switch'
                >
                    <JSSImage field={item.icon} className={styles.icon} />
                    <Text field={item.name} className={styles.name} tag='p' />
                </button>
            ))}
        </div>
        {children}
    </div>
);

export default ButtonSwitch;
