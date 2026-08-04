import * as React from 'react';
import classNames from 'classnames';

import { ICountdownTime } from 'models/data/ICountdownBaner';

interface ICountdownProps {
    time: ICountdownTime[];
    className?: string;
}

const Countdown: React.FC<ICountdownProps> = props => (
    <div className='countdown' data-tid='countdown'>
        {props.time.map((item, i) => (
            <div className='countdown__digit' key={new Date().getTime() + i}>
                <div className={classNames('number', props.className)}>
                    <p>{item.value < 10 ? `0${item.value}` : item.value}</p>
                </div>
                <p className='text'>{item.label}</p>
            </div>
        ))}
    </div>
);

export default Countdown;
