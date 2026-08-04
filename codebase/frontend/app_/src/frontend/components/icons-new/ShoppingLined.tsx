import * as React from 'react';
import classNames from 'classnames';

const SvgShoppingLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'shopping-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M19.7 7.87a1.15 1.15 0 00-1.14-1.06H17a5 5 0 00-10 0H5.44A1.14 1.14 0 004.3 7.86l-1 12.85a1.15 1.15 0 00.29.85 1.16 1.16 0 00.85.38h15.1a1.11 1.11 0 00.83-.37 1.13 1.13 0 00.31-.86zM5.39 19.94l.84-11.13H9v-1.7a3.05 3.05 0 116.1 0v1.7h2.72l.84 11.13z' />
        <path d='M12 5.65a1.78 1.78 0 00-1.78 1.78v.42h3.56v-.42A1.78 1.78 0 0012 5.65z' />
    </svg>
);

export default SvgShoppingLined;
