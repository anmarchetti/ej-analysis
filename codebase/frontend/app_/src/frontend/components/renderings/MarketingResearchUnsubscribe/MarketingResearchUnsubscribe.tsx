import React, { useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';
import { useRouter } from 'next/router';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { logger } from 'frontend/services/logging';
import { UserService } from 'frontend/services/user.service';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { checkIfEmailValid } from 'frontend/utils/validation.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface IMarketingResearchUnsubscribeFields {
    AcceptButton: ISitecoreField<string>;
    DeclineButton: ISitecoreField<string>;
    GoHomeButton: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Image: ISitecoreField<ISitecoreImage>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    UnsubscribedIcon: ISitecoreField<ISitecoreImage>;
    UnsubscribedSubtitle: ISitecoreField<string>;
    UnsubscribedTitle: ISitecoreField<string>;
}

type TMarketingResearchUnsubscribeProps = ISitecoreComponent<IMarketingResearchUnsubscribeFields>;

const MarketingResearchUnsubscribe = ({ fields }: TMarketingResearchUnsubscribeProps) => {
    const { query } = useRouter();

    const email = query[QueryParamName.Email] as string;
    const encEmail = query[QueryParamName.EncEmail] as string;
    const source = query[QueryParamName.Source] as string;

    const {
        Title,
        Subtitle,
        UnsubscribedTitle,
        UnsubscribedSubtitle,
        Image,
        Icon,
        UnsubscribedIcon,
        AcceptButton,
        DeclineButton,
        GoHomeButton,
    } = fields || {};

    const {
        isScreenLessMedium,
        isEditMode,

        redirectToHomePage,
        getPhrase,
    } = useStore(stores => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        isEditMode: stores.layoutStore.isEditMode,

        redirectToHomePage: stores.routerStore.redirectToHomePage,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const [emailValue, setEmailValue] = useState(email); // save email in state, so it doesn't disappear on page change
    const [unsubscribing, setUnsubscribing] = useState(false);
    const [unsubscribed, setUnsubscribed] = useState(false);

    const titleField = {
        value: Tokenizer.replaceToken(Title?.value, Tokens.Email, emailValue),
    };

    useEffect(() => {
        // decrypt encEmail
        if (encEmail) {
            (async () => {
                try {
                    const decryptedEmail = await UserService.decryptEncEmail(encEmail);

                    if (checkIfEmailValid(decryptedEmail)) {
                        setEmailValue(decryptedEmail);
                    } else {
                        throw new Error('Invalid Email');
                    }
                } catch (e) {
                    logger.error(e);
                    redirectToHomePage();
                }
            })();
        } else if (!email) {
            // redirect to homepage if we have no email and encEmail
            redirectToHomePage();
        }
    }, [email, encEmail, redirectToHomePage]);

    const getBackgroundStyles = (): React.CSSProperties | undefined =>
        getSitecoreImageBackgroundStyles(
            Image,
            isScreenLessMedium ? MediaSize.Medium : MediaSize.Large,
            isScreenLessMedium,
            isEditMode,
        );

    const onAccept = async () => {
        if (unsubscribing || !emailValue) {
            return;
        }

        setUnsubscribing(true);

        try {
            // source is optional - defaults to 'csat' in BE
            await UserService.marketingUnsubscribe(emailValue, encEmail, source);
            setUnsubscribed(true);
        } finally {
            setUnsubscribing(false);
        }
    };

    const onDecline = () => {
        redirectToHomePage();
    };

    return (
        <section className='marketing-research-unsubscribe__wrapper' style={getBackgroundStyles()}>
            <div className='marketing-research-unsubscribe wrapper-component-container__inner'>
                {unsubscribed ? (
                    <div className='marketing-research-unsubscribe__content'>
                        {UnsubscribedIcon && (
                            <JSSImage field={UnsubscribedIcon} className='marketing-research-unsubscribe__icon' />
                        )}
                        {UnsubscribedTitle && (
                            <Text
                                tag='div'
                                field={UnsubscribedTitle}
                                className='marketing-research-unsubscribe__title'
                            />
                        )}
                        {UnsubscribedSubtitle && (
                            <RichTextWithLinks
                                field={UnsubscribedSubtitle}
                                className='marketing-research-unsubscribe__subtitle'
                            />
                        )}
                        <div className='marketing-research-unsubscribe__buttons'>
                            <Button isMedium onClick={onDecline}>
                                {GoHomeButton?.value ? (
                                    <Text field={GoHomeButton} />
                                ) : (
                                    getPhrase(SitecoreDictionary.PaymentButtonsGoToTheHomePage)
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className='marketing-research-unsubscribe__content'>
                        {Icon && <JSSImage field={Icon} className='marketing-research-unsubscribe__icon' />}
                        {!!titleField?.value && (
                            <Text tag='div' field={titleField} className='marketing-research-unsubscribe__title' />
                        )}
                        {Subtitle && (
                            <RichTextWithLinks field={Subtitle} className='marketing-research-unsubscribe__subtitle' />
                        )}
                        <div className='marketing-research-unsubscribe__buttons'>
                            <Button isOutlined isMedium onClick={onAccept} isLoading={unsubscribing}>
                                {AcceptButton?.value ? (
                                    <Text field={AcceptButton} />
                                ) : (
                                    getPhrase(SitecoreDictionary.GlobalsButtonsOK)
                                )}
                            </Button>
                            <Button isMedium onClick={onDecline}>
                                {DeclineButton?.value ? (
                                    <Text field={DeclineButton} />
                                ) : (
                                    getPhrase(SitecoreDictionary.GlobalsButtonsCancel)
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default observer(MarketingResearchUnsubscribe);
