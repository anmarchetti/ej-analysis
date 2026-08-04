import * as React from 'react';
import classNames from 'classnames';

const SvgKey = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='0 0 15 13'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'key-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            d='M7.40018 1.39026C6.34251 2.42728 5.97943 3.95226 6.46165 5.33221L0.937707 10.6832L0.75 13L4.03934 12.6801V11.1328H5.56781V9.63724H7.12309L8.98228 7.83916C10.8641 8.4316 12.9118 7.61221 13.8108 5.90712C14.7097 4.20204 14.1926 2.1179 12.5915 0.992948C10.9905 -0.132002 8.78123 0.036502 7.38231 1.39026H7.40018ZM10.3677 2.51406C10.6812 2.20757 11.155 2.11447 11.5673 2.27837C11.9796 2.44227 12.2488 2.83071 12.2488 3.26182C12.2488 3.69294 11.9796 4.08138 11.5673 4.24528C11.155 4.40917 10.6812 4.31608 10.3677 4.00958C9.94401 3.5953 9.94401 2.92835 10.3677 2.51406Z'
            fill='#374151'
        />
    </svg>
);

export default SvgKey;
