import * as React from 'react';
import classNames from 'classnames';

const SvgConfirmFilled = (props: React.SVGProps<SVGSVGElement>): React.JSX.Element => (
    <svg
        viewBox='0 0 24 25'
        width='24'
        height='25'
        fill='none'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'confirm-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            d='M18.0688 6.40685C17.7652 6.43909 17.4818 6.58239 17.2694 6.81202L9.319 15.3005L6.72912 12.5356C6.48834 12.2752 6.15285 12.1256 5.80052 12.1256C5.44818 12.1256 5.11269 12.2752 4.86994 12.5377C4.37636 13.0647 4.37636 13.8997 4.87191 14.4289L8.3823 18.1774C8.89426 18.7241 9.73593 18.7241 10.2479 18.1774L19.1284 8.70338C19.6241 8.17405 19.6241 7.33907 19.1286 6.80991C18.8878 6.54959 18.5523 6.3999 18.2 6.3999L18.0688 6.40685Z'
            fill='#333333'
        />
    </svg>
);

export default SvgConfirmFilled;
