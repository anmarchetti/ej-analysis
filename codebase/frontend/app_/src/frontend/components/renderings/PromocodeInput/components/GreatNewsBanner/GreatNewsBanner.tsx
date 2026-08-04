import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IPromocodeInputFields } from 'frontend/components/renderings/PriceSummary/data/models';

interface IGreatNewsBannerProps {
    fields: IPromocodeInputFields;
}

export const GreatNewsBanner = ({ fields }: IGreatNewsBannerProps) => {
    const { email } = useStore((stores: IHolidaysStores) => ({
        email: stores.userStore.userData?.email,
    }));

    return (
        <div className='great-news-banner'>
            {fields.IconGreatNewsBanner?.value && (
                <JSSImage field={fields.IconGreatNewsBanner} className='great-news-banner__icon' />
            )}
            <div>
                {fields.TitleGreatNewsBanner?.value && (
                    <Text field={fields.TitleGreatNewsBanner} tag='h3' className='great-news-banner__title' />
                )}
                {fields.TextGreatNewsBanner?.value && (
                    <RichTextWithLinks
                        className='great-news-banner__text'
                        field={{
                            value: Tokenizer.replaceToken(fields.TextGreatNewsBanner.value, Tokens.Email, email || ''),
                        }}
                        tag='p'
                    />
                )}
            </div>
        </div>
    );
};

export default observer(GreatNewsBanner);
