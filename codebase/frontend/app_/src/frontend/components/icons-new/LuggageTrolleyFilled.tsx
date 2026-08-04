import * as React from 'react';
import classNames from 'classnames';

const SvgLuggageTrolleyFilled = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'luggage-trolley-filled-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M19.89 17.77H7V6.1L4.82 4A1 1 0 003.4 4a1 1 0 000 1.41L5 6.93v11.54a1.3 1.3 0 001.3 1.3h13.59a1 1 0 000-2z' />
        <circle cx={8} cy={20.77} r={1} />
        <circle cx={16} cy={20.77} r={1} />
        <path d='M11.11 17h4.79a.8.8 0 001.59 0 1.34 1.34 0 001.14-1.31V8.18a1.34 1.34 0 00-1.34-1.34h-1.83V3.45a1.23 1.23 0 00-1.23-1.22h-1.34a1.22 1.22 0 00-1.22 1.22v3.39H9.83a1.34 1.34 0 00-1.34 1.34v7.46a1.32 1.32 0 001 1.28.8.8 0 001.59 0zm2.06-13.27H14v3.11h-.79zm-3.09 7.63V8.43h7v2.93z' />
    </svg>
);

export default SvgLuggageTrolleyFilled;
