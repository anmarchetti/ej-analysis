import * as React from 'react';

import { TFlipSymbol } from './NotFoundFlipText';

interface IFlipCardProps {
    children: TFlipSymbol;
}

const FlipCard = (props: IFlipCardProps) => (
    <div className='flip-card' data-tid='flip-card'>
        <span className='flip-card__top'>
            <span className='flip-card__inner'>{props.children}</span>
        </span>
        <span className='flip-card__down'>
            <span className='flip-card__inner'>{props.children}</span>
        </span>
    </div>
);

export default FlipCard;
