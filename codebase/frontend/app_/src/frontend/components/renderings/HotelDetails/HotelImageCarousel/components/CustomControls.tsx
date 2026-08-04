import * as React from 'react';

interface ICustomControls {
    currentIndex: number;
    imagesLength: number;
}

function CustomControls(props: ICustomControls) {
    return (
        <div className={'hotel-card-img-gallery'}>
            <span>{`${props.currentIndex + 1} / ${props.imagesLength}`}</span>
            <i />
        </div>
    );
}

export default CustomControls;
