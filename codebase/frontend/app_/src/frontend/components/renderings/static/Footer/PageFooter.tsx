import { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

interface IPageFooterParams {
    IsGreyBackground: string;
    IsTriangleStart: string;
}

export type TPageFooterProps = ISitecoreComponent<undefined, IPageFooterParams>;

const PageFooter: FC<TPageFooterProps> = props => {
    const { rendering, params } = props;

    return (
        <>
            {params?.IsTriangleStart === '1' && <div className='wrapper--solid wrapper-triangle--w2o' />}
            <div className={params?.IsGreyBackground ? 'footer--grey' : 'footer--orange'}>
                <div className='wrapper-container wrapper-container--px'>
                    <Placeholder name={PlaceholderNames.FooterRow} rendering={rendering} />
                </div>
            </div>
        </>
    );
};

export default PageFooter;
