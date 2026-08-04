import * as React from 'react';
import classNames from 'classnames';

interface ICardProps {
    children?: any;
    className?: string;
    dataTid?: string;
    pseudoBorder?: boolean;
    selected?: boolean;
}

const Card = (props: ICardProps) => {
    const className = classNames('card', props.className, {
        'card--selected': props.selected,
        'card--pseudo-border': props.pseudoBorder,
    });

    return (
        <div className={className} data-tid={props?.dataTid}>
            <div className='card__inner row g-0'>{props.children}</div>
        </div>
    );
};

export default Card;
