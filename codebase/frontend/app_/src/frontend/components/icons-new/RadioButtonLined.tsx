import * as React from 'react';
import classNames from 'classnames';

const SvgRadioButtonLined = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        viewBox='1 1 22 22'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'radio-button-lined-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M12 4a8 8 0 11-8 8 8 8 0 018-8m0-2a10 10 0 1010 10A10 10 0 0012 2z' />
    </svg>
);

export default SvgRadioButtonLined;
