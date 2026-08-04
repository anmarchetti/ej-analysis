import * as React from 'react';

interface ILoginPopupHeaderProps {
    description: string;
    title: string;
}

const LoginPopupHeader = (props: ILoginPopupHeaderProps) => (
    <>
        <h1 className='page-title text-center' data-tid='login-popup-header-title'>
            {props.title}
        </h1>
        <p className='login__description text-center' data-tid='login-popup-header-description'>
            {props.description}
        </p>
    </>
);

export default LoginPopupHeader;
