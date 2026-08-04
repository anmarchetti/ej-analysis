import * as React from 'react';
import classNames from 'classnames';

const SvgMastercardLogo = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
    <svg
        version='1.1'
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 60 40'
        fill='none'
        xmlSpace='preserve'
        className={classNames(props.className)}
        // eslint-disable-next-line eslintDataTidPlugin/data-tid-in-snake-case
        data-tid={props['data-tid'] ?? 'Mastercard'}
    >
        <title>Mastercard Logo</title>
        <g clipPath='url(#clip0_311_1320)'>
            <path
                d='M58 0H2C0.89543 0 0 0.89543 0 2V38C0 39.1046 0.89543 40 2 40H58C59.1046 40 60 39.1046 60 38V2C60 0.89543 59.1046 0 58 0Z'
                fill='black'
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M48.8982 27.1542V26.6953H48.7783L48.6407 27.011L48.5027 26.6953H48.3828V27.1542H48.4676V26.808L48.5967 27.1066H48.6844L48.8138 26.8073V27.1542H48.8982ZM48.1394 27.1542V26.7735H48.2928V26.696H47.9019V26.7735H48.0553V27.1542H48.1394Z'
                fill='#F79E1B'
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M24.96 29.1234H35.3079V10.5281H24.96V29.1234Z'
                fill='#FF5F00'
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M49.2675 19.8261C49.2675 26.3575 43.9733 31.652 37.4423 31.652C34.6836 31.652 32.1452 30.7072 30.1338 29.1238C32.8843 26.9583 34.6507 23.5984 34.6507 19.8261C34.6507 16.0536 32.8843 12.6937 30.1338 10.5282C32.1452 8.94479 34.6836 8 37.4423 8C43.9733 8 49.2675 13.2945 49.2675 19.8261Z'
                fill='#F79E1B'
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M25.6168 19.8261C25.6168 16.0536 27.3832 12.6937 30.1338 10.5282C28.1223 8.94479 25.584 8 22.8252 8C16.2942 8 11 13.2945 11 19.8261C11 26.3575 16.2942 31.652 22.8252 31.652C25.584 31.652 28.1223 30.7072 30.1338 29.1238C27.3832 26.9583 25.6168 23.5984 25.6168 19.8261Z'
                fill='#EB001B'
            />
        </g>
        <defs>
            <clipPath id='clip0_311_1320'>
                <path
                    d='M0 4C0 1.79086 1.79086 0 4 0H56C58.2091 0 60 1.79086 60 4V36C60 38.2091 58.2091 40 56 40H4C1.79086 40 0 38.2091 0 36V4Z'
                    fill='white'
                />
            </clipPath>
        </defs>
    </svg>
);

export default SvgMastercardLogo;
