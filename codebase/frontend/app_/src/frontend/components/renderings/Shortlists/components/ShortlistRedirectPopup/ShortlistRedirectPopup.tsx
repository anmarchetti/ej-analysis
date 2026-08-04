import { observer } from 'mobx-react';
import sanitize from 'sanitize-html';

import { ENGLISH, getLangByCMSLang } from 'code/cmsLang';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

import styles from './ShortlistRedirectPopup.module.scss';

interface IShortlistRedirectPopupProps {
    bodyContent: ISitecoreField<string>;
    offer: IOffer;
    onClose: () => void;
    onRedirect: () => void;
    redirectLabel: ISitecoreField<string>;
    title: ISitecoreField<string>;
}

const ShortlistRedirectPopup = (props: IShortlistRedirectPopupProps) => {
    const { getPhrase, switchToNewLanguage, getShortlistHotelLink } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getShortlistHotelLink: stores.shortlistStore.getShortlistHotelLink,
        switchToNewLanguage: stores.routerStore.switchToNewLanguage,
    }));

    if (!props.offer) {
        return null;
    }

    const onClose = () => {
        props.onClose();
    };

    const onRedirect = () => {
        const langToSwitch = getLangByCMSLang(props.offer.shortlist?.language || ENGLISH);

        props.onRedirect();
        switchToNewLanguage(langToSwitch || ENGLISH, getShortlistHotelLink(props.offer));
    };

    const footerContent = (
        <>
            <Button isMd isTransparent onClick={onClose} dataTid='shortlist-redirect-popup-cancel'>
                {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
            </Button>
            <Button isMd onClick={onRedirect} dataTid='shortlist-redirect-popup-redirect'>
                {props.redirectLabel.value}
            </Button>
        </>
    );

    const contentWithMarketCode = Tokenizer.replaceToken(
        props.bodyContent.value,
        Tokens.Market,
        props.offer.shortlist?.marketCode?.toLowerCase() || '',
    );

    return (
        <Popup
            title={props.title.value}
            footerContent={footerContent}
            containerClass={styles.redirectPopup}
            id='shortlist-redirect-popup'
        >
            <p dangerouslySetInnerHTML={{ __html: sanitize(contentWithMarketCode) }} />
        </Popup>
    );
};

export default observer(ShortlistRedirectPopup);
