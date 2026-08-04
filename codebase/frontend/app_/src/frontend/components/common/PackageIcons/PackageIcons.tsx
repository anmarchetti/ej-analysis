import { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { IThemePackageIcon } from 'models/data/IHotel';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import LuxuryBadge from 'frontend/components/common/LuxuryBadge/LuxuryBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import ChevronDown from 'frontend/components/icons/ChevronDown';
import SvgChevronDownGradient from 'frontend/components/icons-new/ChevronDownGradient';
import ListedItems from 'frontend/components/renderings/ListedItems/ListedItems';

import usePackageIcons from './PackageIcons.utils';

import styles from './PackageIcons.module.scss';

export interface IPackageIconsProps {
    extraLuggage: Nullable<IExtraLuggageInfo>;
    isLuxury: boolean;
    packageIcons: IThemePackageIcon[];
    transfer: Nullable<ITransfer>;
    className?: string;
    rendering?: any;
}

const PackageIcons: FC<IPackageIconsProps> = ({ rendering, className, ...props }) => {
    const { isLuxury } = props;

    const { getPhrase, customItems } = usePackageIcons(props);

    if (!customItems?.length && !isLuxury) return null;

    return (
        <div className={classNames(styles.wrapper, className)}>
            <Tooltip placement='bottom'>
                <TooltipTrigger>
                    <button className={styles.triggerWrapper} data-tid='what-is-included-wrapper'>
                        <div
                            className={classNames(styles.trigger, { [styles.triggerLuxury]: isLuxury })}
                            data-tid='tooltip-trigger'
                        >
                            <p className={classNames(styles.label, styles.text)} data-tid='what-is-included-label'>
                                {getPhrase(SitecoreDictionary.LuxuryLabelsIncludes)}
                            </p>

                            {isLuxury ? (
                                <LuxuryBadge />
                            ) : (
                                <ListedItems
                                    className={styles.items}
                                    itemClassName={styles.item}
                                    customItems={customItems}
                                />
                            )}

                            <span className={styles.arrowWrapper} data-tid='what-is-included-arrow'>
                                {isLuxury ? <SvgChevronDownGradient /> : <ChevronDown />}
                            </span>
                        </div>
                    </button>
                </TooltipTrigger>

                <TooltipContent className={classNames(styles.tooltipContentWrapper, styles.priority)}>
                    <div className={styles.tooltipContent} data-tid='what-is-included-content'>
                        <h5 className={classNames(styles.header, styles.text)} data-tid='what-is-included-header'>
                            {getPhrase(SitecoreDictionary.LuxuryLabelsThisHolidayIncludes)}
                        </h5>

                        {isLuxury ? (
                            <Placeholder name='listed-items' rendering={rendering} />
                        ) : (
                            <ListedItems customItems={customItems} />
                        )}

                        <p className={styles.text} data-tid='what-is-included-more'>
                            {getPhrase(SitecoreDictionary.LuxuryLabelsWhatsIncludedMore)}
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export default observer(PackageIcons);
