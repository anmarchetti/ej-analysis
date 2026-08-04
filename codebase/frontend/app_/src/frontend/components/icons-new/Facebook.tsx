import { FC, SVGProps } from 'react';
import classNames from 'classnames';

const SvgFacebook: FC<SVGProps<SVGSVGElement>> = props => (
    <svg
        viewBox='0 0 36 36'
        width='1em'
        height='1em'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'facebook-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path d='M22.9963 7.98125H25.735V3.21125C25.2625 3.14625 23.6375 3 21.745 3C17.7963 3 15.0913 5.48375 15.0913 10.0487V14.25H10.7338V19.5825H15.0913V33H20.4338V19.5837H24.615L25.2788 14.2513H20.4325V10.5775C20.4338 9.03625 20.8488 7.98125 22.9963 7.98125Z' />
    </svg>
);

export default SvgFacebook;
