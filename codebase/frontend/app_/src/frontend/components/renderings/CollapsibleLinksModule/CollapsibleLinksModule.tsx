import * as React from 'react';
import { FC, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import {
    getCustomisableTitleClassName,
    getPaddingSizeClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import { ICustomisableComponentParamsWithTitleTag } from 'models/data/ICustomisableComponentParams';
import INavLink from 'models/data/INavLink';
import { ITrackingModuleClickParams } from 'models/data/tracking/ITrackingModuleClickParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ICompressedSitecoreLink, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Drawer from 'frontend/components/common/Drawer';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import LinksList from './components/LinksList/LinksList';
import ToggleButton from './components/ToggleButton/ToggleButton';
import { useCollapsibleLinksByColumns, useMaxVisibleLinksInColumn } from './CollapsibleLinks.hooks';

import styles from './CollapsibleLinksModule.module.scss';

export interface ICollapsibleLinksModuleFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    Links?: INavLink[];
    Pages?: ICompressedSitecoreLink[];
}

export interface ICollapsibleLinksModuleParams
    extends ITrackingModuleClickParams,
        ICustomisableComponentParamsWithTitleTag {
    Columns: string;
    ColumnsOnMobile: string;
    MaxVisibleLinks: string;
    MaxVisibleLinksOnMobile: string;
}

export type TCollapsibleLinksModuleProps = ISitecoreComponent<
    ICollapsibleLinksModuleFields,
    ICollapsibleLinksModuleParams
>;

export const CollapsibleLinksModule: FC<TCollapsibleLinksModuleProps> = ({ fields, params, rendering }) => {
    const isExtraSmall = useXSMobileViewport();
    const { links, linksByColumns, numberOfColumns } = useCollapsibleLinksByColumns(fields, params);
    const [isBlockExpanded, setIsBlockExpanded] = useState<boolean>(false);
    const drawerContentRef = useRef<HTMLDivElement>(null);

    const totalLinksNumber = links.length;
    const { MaxVisibleLinksOnMobile, MaxVisibleLinks, TitleTag, PaddingSize } = params;
    const totalInitialVisibleLinks =
        Number(isExtraSmall ? MaxVisibleLinksOnMobile : MaxVisibleLinks) || totalLinksNumber;
    const maxLinksInColumn = useMaxVisibleLinksInColumn(
        isBlockExpanded,
        totalLinksNumber,
        totalInitialVisibleLinks,
        numberOfColumns,
    );

    if (!fields || !totalLinksNumber) {
        return null;
    }

    const canBlockBeExpanded = totalInitialVisibleLinks < totalLinksNumber;

    const renderTitles = (): React.JSX.Element => (
        <>
            <Text
                tag={TitleTag || 'h2'}
                className={getCustomisableTitleClassName(styles.collapsibleLinksTitle, params)}
                field={fields.Title}
            />
            <RichTextWithLinks field={fields.Subtitle} />
        </>
    );

    return (
        <div className={classNames(styles.collapsibleLinks, getPaddingSizeClassName(PaddingSize))}>
            {renderTitles()}
            <div className={styles.roundedContainer}>
                <div className={styles.columns}>
                    {linksByColumns.map((links, i) => (
                        <LinksList
                            links={links.slice(0, maxLinksInColumn)}
                            fields={fields}
                            key={`${rendering.uid}-${i}`}
                            listIndex={i}
                            maxLinksInColumn={maxLinksInColumn}
                            rendUid={rendering.uid}
                            params={params}
                        />
                    ))}
                </div>
                {canBlockBeExpanded && (
                    <div className={styles.showMore} data-tid='show-more'>
                        <ToggleButton
                            drawerContentRef={drawerContentRef}
                            moduleTitle={fields.Title?.value || ''}
                            isBlockExpanded={isBlockExpanded}
                            params={params}
                            rendUid={rendering.uid}
                            setIsBlockExpanded={setIsBlockExpanded}
                        />
                    </div>
                )}
            </div>
            {/* Render the drawer only when show more button was clicked and the content should be displayed
                Pros: there’s no animation and no need to keep it permanently hidden  */}
            {isExtraSmall && isBlockExpanded && (
                <Drawer open={isBlockExpanded} className='drawer--scrollable'>
                    <div className='drawer__content' ref={drawerContentRef}>
                        {renderTitles()}
                        <LinksList
                            links={links}
                            fields={fields}
                            listIndex={0}
                            maxLinksInColumn={maxLinksInColumn}
                            rendUid={rendering.uid}
                            params={params}
                            additionalClass={styles.drawerList}
                        />
                    </div>

                    <div className='drawer__actions'>
                        <ToggleButton
                            drawerContentRef={drawerContentRef}
                            moduleTitle={fields.Title?.value || ''}
                            isBlockExpanded={isBlockExpanded}
                            params={params}
                            rendUid={rendering.uid}
                            setIsBlockExpanded={setIsBlockExpanded}
                            isDrawerBtn
                        />
                    </div>
                </Drawer>
            )}
        </div>
    );
};

export default observer(CollapsibleLinksModule);
