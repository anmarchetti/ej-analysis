import * as React from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import {
    containerClassName,
    IComponentWrapperSitecoreParams,
    paddingClassName,
    shapeClassName,
} from 'frontend/utils/ComponentWrapper.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

export interface IComponentWrapper {
    children?: any;
    params?: Partial<IComponentWrapperSitecoreParams>;
    rendering?: ComponentRendering;
}

export const ComponentWrapper: React.FunctionComponent<IComponentWrapper> = props => {
    const params = props.params || {};

    return (
        <div
            className={classNames(containerClassName(params), paddingClassName(params))}
            id={params.Anchor}
            data-tid='wrapper-container'
        >
            <div className={shapeClassName(params)} data-tid='wrapper-shape'>
                <div className='wrapper-shape__triangle-start' />

                <div className='wrapper-component-container__inner' data-tid='wrapper-inner'>
                    {!!props.rendering ? (
                        <Placeholder name={PlaceholderNames.ComponentWrapperInner} rendering={props.rendering} />
                    ) : (
                        props.children
                    )}
                </div>

                <div className='wrapper-shape__triangle-end' />
            </div>
        </div>
    );
};

export default ComponentWrapper;
