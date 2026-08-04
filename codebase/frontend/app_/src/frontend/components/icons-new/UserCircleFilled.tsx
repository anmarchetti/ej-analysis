import * as React from 'react';
import classNames from 'classnames';

const SvgUserCircleFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        aria-hidden='true'
        focusable='false'
        data-tid={'user-circle-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <rect width='24' height='24' rx='12' fill='#333333' />
        <path
            d='M13.941 12.034C15.1573 11.2018 15.6897 9.67444 15.2541 8.26656C14.8186 6.85867 13.5168 5.89868 12.043 5.89868C10.5693 5.89868 9.26749 6.85867 8.83196 8.26656C8.39643 9.67444 8.9288 11.2018 10.1451 12.034C7.72486 12.2316 5.86088 14.2527 5.85938 16.6809V18.1013H18.141V16.6809C18.1407 14.2838 16.3259 12.2759 13.941 12.034Z'
            fill='white'
        />
    </svg>
);

export default SvgUserCircleFilled;
