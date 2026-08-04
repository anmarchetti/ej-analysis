import { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

const PageFooterSlim: FC<ISitecoreComponent> = ({ rendering }) => (
    <>
        <div className='wrapper--solid wrapper-triangle--w2o' />
        <div className='footer-slim footer--orange'>
            <div className='wrapper-container wrapper-container--px'>
                <Placeholder name={PlaceholderNames.FooterRow} rendering={rendering} />
            </div>
        </div>
    </>
);

export default PageFooterSlim;
