import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgLuxury from 'frontend/components/icons-new/Luxury';
import SvgLuxuryGradient from 'frontend/components/icons-new/LuxuryGradient';

import styles from './LuxuryWrapper.module.scss';

export enum LuxuryTheme {
    Default = 'Default',
    Light = 'Light',
    DarkOrange = 'DarkOrange',
}

export interface ILuxuryWrapperProps {
    children: React.ReactNode;
    bannerClassName?: string;
    contentClassName?: string;
    id?: string;
    label?: string;
    renderChildrenOnly?: boolean;
    theme?: LuxuryTheme;
    wrapperClassName?: string;
}

const LuxuryWrapper: FC<ILuxuryWrapperProps> = ({
    children,
    label,
    renderChildrenOnly = false,
    wrapperClassName,
    bannerClassName,
    contentClassName,
    id = '',
    theme = LuxuryTheme.Default,
}) => {
    const { getPhrase, isPostBookingPages } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isPostBookingPages: stores.layoutStore.isPostBookingPages,
    }));

    if (renderChildrenOnly)
        return id ? (
            <div id={id} className={wrapperClassName} data-tid='luxury-wrapper-without-banner'>
                {children}
            </div>
        ) : (
            <>{children}</>
        );

    return (
        <div
            className={classNames(styles.luxuryWrapper, wrapperClassName, {
                [styles.lightTheme]: theme === LuxuryTheme.Light,
                [styles.darkOrangeTheme]: theme === LuxuryTheme.DarkOrange,
            })}
            data-tid='luxury-wrapper'
            id={id}
        >
            <div className={classNames(styles.luxuryBanner, bannerClassName)} data-tid='luxury-banner'>
                {theme === LuxuryTheme.Default ? (
                    <SvgLuxuryGradient className={styles.icon} />
                ) : (
                    <SvgLuxury className={styles.icon} />
                )}

                <span>{label ?? getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)}</span>
            </div>

            <div
                data-tid='luxury-content'
                className={classNames(styles.luxuryContent, contentClassName, {
                    [styles.noBorders]: isPostBookingPages,
                })}
            >
                {children}
            </div>
        </div>
    );
};

export default observer(LuxuryWrapper);
