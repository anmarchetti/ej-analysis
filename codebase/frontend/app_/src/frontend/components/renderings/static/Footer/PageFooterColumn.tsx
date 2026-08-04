import { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

const PageFooterColumn: FC<ISitecoreComponent> = ({ rendering }) => (
    <div className='col-auto'>
        <Placeholder name={PlaceholderNames.FooterColumnInner} rendering={rendering} />
    </div>
);

export default PageFooterColumn;
