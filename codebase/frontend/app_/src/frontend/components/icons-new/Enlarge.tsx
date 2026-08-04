import { FC, SVGProps } from 'react';
import classNames from 'classnames';

const SvgEnlarge: FC<SVGProps<SVGSVGElement>> = props => (
    <svg
        width='1em'
        height='1em'
        viewBox='0 0 16 16'
        fill='none'
        aria-hidden='true'
        focusable='false'
        data-tid={props['data-tid'] ?? 'enlarge-icon'}
        className={classNames('icon-svg', props.className)}
    >
        <path
            d='M10.6673 1.33325V2.66659L12.3747 2.66659L9.3868 5.65446L10.3296 6.59727L13.334 3.5929V5.33325H14.6673V1.33325L10.6673 1.33325Z'
            fill='white'
        />
        <path
            d='M1.33398 10.6666H2.66732V12.3739L5.61719 9.42407L6.56 10.3669L3.59363 13.3333H5.33398V14.6666H1.33398V10.6666Z'
            fill='white'
        />
        <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M14.6674 2.66659V1.33325H13.334L9.33405 1.33325V2.66659H12.3747L8.44401 6.59731L9.38682 7.54012L13.334 3.5929V6.66659H14.6674V2.66659ZM6.55827 8.48267L7.50108 9.42548L3.5933 13.3333H6.66732V14.6666H2.66732H1.33398V13.3333V9.33325H2.66732V12.3736L6.55827 8.48267Z'
            fill='white'
        />
    </svg>
);

export default SvgEnlarge;
