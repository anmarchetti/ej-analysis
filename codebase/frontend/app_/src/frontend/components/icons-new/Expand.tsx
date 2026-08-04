import classNames from 'classnames';

const Expand = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        width='1em'
        height='1em'
        viewBox='0 0 20 20'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        focusable='false'
        aria-hidden='true'
        className={classNames('icon-svg', props.className)}
    >
        <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M20.0001 2V4.76837e-07H18.0001L12.0001 0V2H16.5611L10.665 7.89609L12.0793 9.3103L18.0001 3.38946V8H20.0001V2ZM7.83643 10.7241L9.25064 12.1383L3.38898 18H8V20H2H0V18V12H2V16.5605L7.83643 10.7241Z'
            fill='currentColor'
        />
    </svg>
);

export default Expand;
