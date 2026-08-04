import * as React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import SingInSection from 'frontend/components/renderings/LoginForm/components/SingInSection';
import LoginPopupHeader from 'frontend/components/renderings/ViewBooking/components/LoginPopupHeader';

import styles from './LoginDrawer.module.scss';

interface ILoginDrawerProps {
    description: string;
    isShown: boolean;
    onClose: () => void;
    onLogin: () => void;
    title: string;
}

const LoginDrawer = (props: ILoginDrawerProps) => {
    const { getPhrase, customerLogin } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        customerLogin: stores.userStore.customerLogin,
    }));

    return (
        <Drawer open={props.isShown} className={styles.container}>
            <div className='row'>
                <div className='col-12 login-form login-form--drawer'>
                    <div className='wrapper-container wrapper-container--px'>
                        <LoginPopupHeader title={props.title} description={props.description} />
                        <SingInSection isCtaHidden isReCaptchaDisabled={!props.isShown} />
                    </div>
                </div>
                <div className='col-12 drawer__actions'>
                    <Button onClick={props.onClose} isFullWidth isTransparent dataTid='login-drawer-close'>
                        {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                    </Button>

                    <Button
                        onClick={props.onLogin}
                        disabled={customerLogin.emailErrors.length > 0 || customerLogin.passwordErrors.length > 0}
                        isFullWidth
                        dataTid='login-drawer-confirm'
                    >
                        {getPhrase(SitecoreDictionary.LoginButtonsSignIn)}
                    </Button>
                </div>
            </div>
        </Drawer>
    );
};

export default observer(LoginDrawer);
