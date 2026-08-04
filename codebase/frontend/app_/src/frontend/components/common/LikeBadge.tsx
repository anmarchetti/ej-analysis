import * as React from 'react';

import { isEmptyHtmlContent } from 'frontend/utils/html.utils';
import SvgRibbonLined from 'frontend/components/icons-new/RibbonLined';

interface ILikeBadgeProps {
    text?: string;
}
const LikeBadge = (props: ILikeBadgeProps) => {
    if (isEmptyHtmlContent(props.text || '')) {
        return null;
    }

    return (
        <div className='like-badge'>
            <SvgRibbonLined />
            <span dangerouslySetInnerHTML={{ __html: props.text || '' }} />
        </div>
    );
};

export default LikeBadge;
