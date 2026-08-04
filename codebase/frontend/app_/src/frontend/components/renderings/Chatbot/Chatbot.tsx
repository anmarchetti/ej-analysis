import { FC, useEffect } from 'react';
import classNames from 'classnames';
import Head from 'next/head';

import { ENGLISH, ENGLISH_REGION, getCMSLang, TLangs, TRedion } from 'code/cmsLang';
import { envPublic } from 'code/env';
import { useMount } from 'frontend/hooks/useMount';
import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

import { createHelpChatbotScript, createSalesChatbotScript } from './components/createChatbotsScripts';

interface IChatbotParams {
    IsSalesChatbot: TSitecoreCheckboxValue;
}

interface IChatbotFields {
    SCAnalyticsGlobalValue: Nullable<string>;
    Title: ISitecoreField<string>;
}

type TChatbotProps = ISitecoreComponent<IChatbotFields, IChatbotParams>;

const Chatbot: FC<TChatbotProps> = ({ params, fields }) => {
    const { isEditMode, currentPath, isHotelDetailsBookPage, getSettingAsBoolean, langWithMarket } = useStore(
        (stores: TStores) => ({
            isEditMode: stores.layoutStore.isEditMode,
            currentPath: stores.layoutStore.currentPath,
            isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
            getSettingAsBoolean: stores.layoutStore.getSettingAsBoolean,
            langWithMarket: stores.layoutStore.lang,
        }),
    );

    const isChatbotEnabled = getSettingAsBoolean(SiteSettings.IsChatbotEnabled);
    const isSalesChatbot = isSitecoreCheckboxSelected(params?.IsSalesChatbot);
    const prevPagePath = usePrevious(currentPath);
    const isPrevHotelDetilsBookPage = usePrevious(isHotelDetailsBookPage);

    const addChatbotCreationScript = () => {
        const script = document.createElement('script');

        const [langWithoutMarket = ENGLISH, region = ENGLISH_REGION] = getCMSLang(langWithMarket).split('-');

        const inlineScript = document.createTextNode(
            isSalesChatbot
                ? createSalesChatbotScript(
                      fields?.Title?.value || '',
                      fields?.SCAnalyticsGlobalValue || '',
                      langWithoutMarket as TLangs,
                      langWithMarket || ENGLISH,
                      region as TRedion,
                  )
                : createHelpChatbotScript(
                      fields?.Title?.value || '',
                      fields?.SCAnalyticsGlobalValue || '',
                      langWithoutMarket as TLangs,
                      langWithMarket || ENGLISH,
                  ),
        );
        script.appendChild(inlineScript);
        const chatbot = document.getElementsByClassName('chatbot')[0];
        chatbot?.appendChild(script);
    };

    useMount(() => {
        if (isEditMode || !isChatbotEnabled) {
            return;
        }

        addChatbotCreationScript();
    });

    useEffect(() => {
        /** Needs when we change one hotel details page to another to update chatbot */
        if (isChatbotEnabled && isHotelDetailsBookPage && isPrevHotelDetilsBookPage && prevPagePath !== currentPath) {
            addChatbotCreationScript();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPath, isHotelDetailsBookPage, isChatbotEnabled]);

    if (isEditMode || !isChatbotEnabled) {
        return null;
    }

    return (
        /**key={currentPath} needs to automaticalyy remove scripts that was injected in element before. Needs when we change one hotel details page to another */
        <div className={classNames('chatbot', isSalesChatbot && 'sales-chatbot')} key={currentPath}>
            {isSalesChatbot ? (
                <>
                    <Head>
                        <link
                            rel='stylesheet'
                            type='text/css'
                            href={`https://firebasestorage.googleapis.com/v0/b/ejh-chatbot.appspot.com/o/${envPublic.CHATBOT_CSS_FILE}`}
                        />
                    </Head>
                </>
            ) : (
                <Head>
                    <script src='https://storage.googleapis.com/easyjet-chatbot2020-javascript/webcomponents-sd-ce-pf.js' />
                    <script src='https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1' />
                    <meta
                        name='viewport'
                        content='width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, shrink-to-fit=no'
                    />
                </Head>
            )}

            <style
                type='text/css'
                dangerouslySetInnerHTML={{
                    __html: `df-messenger {
                            --df-messenger-bot-message: #FB5600;
                            --df-messenger-button-titlebar-color: #FB5600;
                            --df-messenger-button-titlebar-font-color: white;
                            --df-messenger-chat-background-color: #FAFAFA;
                            --df-messenger-font-color: white;
                            --df-messenger-send-icon: #FB5600;
                            --df-messenger-user-message: #7C7C7C;
                        }
                        .chatbot .modal-content {
                            display: flex;
                            flex-direction: column;
                        }
                        .chatbot .modal-content .content{
                            flex:1;
                        } 
                        .chatbot .modal-content .content #map{
                            height:100%;
                        }`,
                }}
            />
        </div>
    );
};

export default Chatbot;
