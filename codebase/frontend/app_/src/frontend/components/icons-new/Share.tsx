import * as React from 'react';
import classNames from 'classnames';

const SvgShare = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'share-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M19 16a3 3 0 00-2.08.84L8 12.36A2.2 2.2 0 008 12a2.33 2.33 0 000-.37l9-4.47A3 3 0 1016 5a2.2 2.2 0 000 .36L7 9.84a3 3 0 100 4.32l9 4.48a2.2 2.2 0 000 .36 3 3 0 103-3z' />
    </svg>
);

export default SvgShare;
