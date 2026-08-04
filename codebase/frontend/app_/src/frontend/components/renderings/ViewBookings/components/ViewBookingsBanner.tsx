import React, { FC, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import sanitizeHtml from 'sanitize-html';

import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

import styles from './ViewBookingsBanner.module.scss';

interface IViewBookingBannerProps {
    imageUrl?: string;
    isTriangleGrey?: boolean;
}

export const ViewBookingsBanner: FC<IViewBookingBannerProps> = ({ imageUrl, isTriangleGrey }) => {
    const { userData, setUserDetails, getPhrase } = useStore((stores: IHolidaysStores) => ({
        userData: stores.userStore.userData,
        setUserDetails: stores.userStore.setUserDetails,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    useEffect(() => {
        setUserDetails();
    }, []);

    const welcomeMessage = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.ViewBookingsTitlesWelcomeBack),
        Tokens.Name,
        `<span data-cs-mask="true">${sanitizeHtml(userData?.firstName || '')}</span>`,
    );

    return (
        <div
            className={styles.bookingsBanner}
            style={imageUrl ? { backgroundImage: `url(${cmsUrls.media(imageUrl)})` } : undefined}
        >
            <div className='wrapper-container wrapper-container--px'>
                <div className={styles.titleWrapper}>
                    <RichTextDictionary tag='h2' content={welcomeMessage} />
                    {!!userData?.email && <h4 data-cs-mask>{userData.email}</h4>}
                </div>
            </div>
            <div
                className={classNames(styles.heroBannerTriangle, { [styles.heroBannerTriangleGrey]: isTriangleGrey })}
            />
        </div>
    );
};

export default observer(ViewBookingsBanner);
