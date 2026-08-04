import React, { FunctionComponent } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import { IComponentWithRerenderProps, withRerender } from 'frontend/components/hoc/withRerender';

import styles from './MasonryWrapper.module.scss';

interface IMasonryWrapperRenderingParameters {
    ReverseView: TSitecoreCheckboxValue;
}

export type TMasonryWrapperProps = ISitecoreComponent<object, IMasonryWrapperRenderingParameters> &
    IComponentWithRerenderProps;

export const MasonryWrapper: FunctionComponent<TMasonryWrapperProps> = ({ rendering, params, wasRerendered }) => {
    const isMobile = useMobileViewport();

    return (
        <div
            className={classNames(styles.wrapper, {
                [styles.reverseView]: isSitecoreCheckboxSelected(params.ReverseView),
            })}
            data-tid='masonry-wrapper'
        >
            {wasRerendered && !isMobile ? (
                <>
                    <aside className={styles.aside} data-tid='masonry-aside-wrapper'>
                        <Placeholder name={PlaceholderNames.MasonryAside} rendering={rendering} />
                    </aside>
                    <section className={styles.section} data-tid='masonry-section-wrapper'>
                        <Placeholder name={PlaceholderNames.MasonrySection} rendering={rendering} />
                    </section>
                </>
            ) : (
                <>
                    <Placeholder name={PlaceholderNames.MasonrySection} rendering={rendering} />
                    <Placeholder name={PlaceholderNames.MasonryAside} rendering={rendering} />
                </>
            )}
        </div>
    );
};

export default withRerender(observer(MasonryWrapper));
