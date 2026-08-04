import React, { createContext, FunctionComponent, useContext } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import LuxuryWrapper, { LuxuryTheme } from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';

import PromotingBanner from './components/PromotingBanner/PromotingBanner';
import { OutlineBannerTheme } from './OutlineBannerTheme';

import styles from './OutlineBanner.module.scss';

export interface IOutlineBannerProps {
    children?: any;
    className?: string;
    color?: string;
    textContent?: ISitecoreField<string>;
}

export const OutlineBannerContext = createContext<{ theme?: OutlineBannerTheme }>({
    theme: OutlineBannerTheme.NoTheme,
});

const OutlineBanner: FunctionComponent<IOutlineBannerProps> = (props: IOutlineBannerProps) => {
    const { color, textContent, children, className } = props;
    const { isPostBookingPages, getPhrase } = useStore(({ layoutStore }: TStores) => ({
        isPostBookingPages: layoutStore.isPostBookingPages,
        getPhrase: layoutStore.getPhrase,
    }));
    const { theme } = useContext(OutlineBannerContext);

    if (theme === OutlineBannerTheme.LuxuryTheme) {
        return <LuxuryWrapper label={getPhrase(SitecoreDictionary.LuggageLabelsIncluded)}>{children}</LuxuryWrapper>;
    }

    if (theme === OutlineBannerTheme.LuxuryLightTheme) {
        return (
            <LuxuryWrapper label={getPhrase(SitecoreDictionary.LuggageLabelsIncluded)} theme={LuxuryTheme.Light}>
                {children}
            </LuxuryWrapper>
        );
    }

    if (theme === OutlineBannerTheme.LuxuryDarkOrangeTheme) {
        return (
            <LuxuryWrapper label={getPhrase(SitecoreDictionary.LuggageLabelsIncluded)} theme={LuxuryTheme.DarkOrange}>
                {children}
            </LuxuryWrapper>
        );
    }

    if (theme === OutlineBannerTheme.PromoTheme && color) {
        return (
            <PromotingBanner color={color} textContent={textContent}>
                {children}
            </PromotingBanner>
        );
    }

    return <div className={classNames(className, { [styles.outlineBanner]: !isPostBookingPages })}>{children}</div>;
};

export default observer(OutlineBanner);
