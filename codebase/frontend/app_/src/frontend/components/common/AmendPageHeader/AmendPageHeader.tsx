import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import SitePath, { SitePathOverload } from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import AmendPageServiceMessages from 'frontend/components/common/AmendPageServiceMessages/AmendPageServiceMessages';
import { TErrataOverrides } from 'frontend/components/common/AmendPageServiceMessages/AmendPageServiceMessages.utils';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import AmendDatesBreadcrumbs from 'frontend/components/renderings/AmendDatesSummary/components/AmendDatesBreadcrumbs/AmendDatesBreadcrumbs';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

import styles from './AmendPageHeader.module.scss';

interface IAmendPageHeaderProps {
    rendering: ISitecoreComponent['rendering'];
    subtitle: ISitecoreField<string>;
    title: ISitecoreField<string>;
    breadcrumbRootPath?: SitePath;
    breadcrumbRootText?: SitePathOverload;
    errataOverrides?: TErrataOverrides;
    isAttentionMessageOn?: boolean;
    isBackgroundGrey?: boolean;
}

const AmendPageHeader: FunctionComponent<IAmendPageHeaderProps> = ({
    rendering,
    subtitle,
    title,
    breadcrumbRootPath,
    breadcrumbRootText,
    isAttentionMessageOn,
    isBackgroundGrey = true,
    errataOverrides,
}) => (
    <div className={styles.header}>
        <ComponentWrapper params={{ IsGreyBackground: isBackgroundGrey ? '1' : undefined }}>
            <AmendDatesBreadcrumbs rootPath={breadcrumbRootPath} rootText={breadcrumbRootText} />
            <div className={styles.titles}>
                {!!title?.value && <Text tag='h2' className={styles.title} field={title} />}
                {!!subtitle?.value && <RichTextWithLinks field={subtitle} />}
            </div>

            {isAttentionMessageOn && (
                <AmendPageServiceMessages rendering={rendering} errataOverrides={errataOverrides} />
            )}
        </ComponentWrapper>
    </div>
);

export default AmendPageHeader;
