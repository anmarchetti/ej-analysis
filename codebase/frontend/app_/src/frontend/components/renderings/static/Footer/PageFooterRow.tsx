import { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import FooterRowThemes from 'models/enum/FooterRowThemes';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

interface IPageFooterRowParams {
    Theme: FooterRowThemes;
}

export type TPageFooterRowProps = ISitecoreComponent<undefined, IPageFooterRowParams>;

const PageFooterRow: FC<TPageFooterRowProps> = ({ rendering, params }) => {
    const rowClass = classNames(
        'footer__row',
        'row',
        params?.Theme === FooterRowThemes.Dropdowns && 'footer-dropdowns',
        params?.Theme === FooterRowThemes.Protection && 'footer-protection',
        params?.Theme === FooterRowThemes.NeedHelp && 'footer-need-help',
    );

    return (
        <div className={rowClass} data-tid='footer-row'>
            <Placeholder name={PlaceholderNames.FooterColumn} rendering={rendering} />
        </div>
    );
};

export default PageFooterRow;
