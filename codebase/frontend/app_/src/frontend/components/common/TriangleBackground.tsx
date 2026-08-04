import * as React from 'react';
import classNames from 'classnames';

import { buildFrontendImageWithFallBack } from 'frontend/utils/url.utils';

interface ITriangleBackgroundProps {
    className?: string;
    fallbackImageURL?: string;
    imageURL?: string;
    isGray?: boolean;
    isOverlaid?: boolean;
    isTransparent?: boolean;
}

const TriangleBackground = (props: ITriangleBackgroundProps) => {
    const className = classNames(
        'triangle-background',
        props.isTransparent && 'semi-transparent',
        props.isGray && 'gray',
        props.isOverlaid && 'with-overlay',
        props.className,
    );
    const backgroundImage = buildFrontendImageWithFallBack(props.imageURL, props.fallbackImageURL);

    return (
        <div className={className} style={{ backgroundImage }}>
            <div className='triangle--w2o' />
        </div>
    );
};

export default TriangleBackground;
