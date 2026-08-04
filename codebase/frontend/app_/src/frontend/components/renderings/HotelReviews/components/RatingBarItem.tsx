import * as React from 'react';

interface IRatingBarItemProps {
    mark: string;
    percentage_value: number;
}

export const RatingBarItem = (props: IRatingBarItemProps) => (
    <React.Fragment>
        <span className='title'>{props.mark}</span>
        <div className='progress_bar'>
            <div className='progress' style={{ width: props.percentage_value + '%' }} />
        </div>
        <span className='percentage'>{props.percentage_value}%</span>
    </React.Fragment>
);
