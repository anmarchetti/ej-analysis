import * as React from 'react';

import FlipCard from './FlipCard';
import { TFlipSymbol } from './NotFoundFlipText';

interface IFlipCardLineProps {
    symbols: TFlipSymbol[];
}

const FlipCardLine = ({ symbols }: IFlipCardLineProps) => (
    <div className='flip-card-line' data-tid='flip-card-line'>
        {symbols.map((symbol, i) => (
            <FlipCard key={i}>{symbol}</FlipCard>
        ))}
    </div>
);

export default FlipCardLine;
