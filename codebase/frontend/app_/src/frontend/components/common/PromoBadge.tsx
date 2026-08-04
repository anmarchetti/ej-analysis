import * as React from 'react';
import { RichText } from '@sitecore-jss/sitecore-jss-react';

import { isEmptyHtmlContent } from 'frontend/utils/html.utils';
import SvgPromo from 'frontend/components/icons-new/Promo';

interface IPromoBadgeProps {
    text?: string;
}

const PromoBadge = (props: IPromoBadgeProps) => {
    if (isEmptyHtmlContent(props.text || '')) {
        return null;
    }

    return (
        <div className='like-badge promo'>
            <SvgPromo />
            <RichText field={{ value: props?.text || '' }} tag='span' />
        </div>
    );
};

export default PromoBadge;
