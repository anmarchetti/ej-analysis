import * as React from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import {
    containerClassName,
    IComponentWrapperSitecoreParams,
    shapeClassName,
} from 'frontend/utils/ComponentWrapper.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import styles from 'frontend/components/renderings/static/HorizontalComponentWrapper/HorizontalComponentWrapper.module.scss';

export interface IHorizontalComponentWrapper {
    children?: any;
    params?: Partial<IComponentWrapperSitecoreParams>;
    rendering?: ComponentRendering;
}

export const HorizontalComponentWrapper: React.FunctionComponent<IHorizontalComponentWrapper> = props => {
    const params = props.params || {};

    return (
        <div className={containerClassName(params)} id={params.Anchor} data-tid='wrapper-container'>
            <div className={shapeClassName(params)} data-tid='wrapper-shape'>
                <div className={classNames('wrapper-container__direction', styles.direction)}>
                    <div className={styles.innerWrapper} data-tid='wrapper-left'>
                        {props.rendering ? (
                            <Placeholder name={PlaceholderNames.ComponentWrapperLeft} rendering={props.rendering} />
                        ) : (
                            props.children
                        )}
                    </div>
                    <div className={styles.innerWrapper} data-tid='wrapper-right'>
                        {props.rendering ? (
                            <Placeholder name={PlaceholderNames.ComponentWrapperRight} rendering={props.rendering} />
                        ) : (
                            props.children
                        )}
                    </div>
                </div>
                <div className='wrapper-shape__triangle-end' />
            </div>
        </div>
    );
};

export default HorizontalComponentWrapper;
