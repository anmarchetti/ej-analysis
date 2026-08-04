import { FC } from 'react';
import { observer } from 'mobx-react';

import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { IRoute } from 'models/data/IRoute';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ReferenceItem from 'frontend/components/common/Booking/BookingRefs/ReferenceItem/ReferenceItem';
import Callout from 'frontend/components/common/Callout/Callout';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgInfoLined from 'frontend/components/icons-new/InfoLined';
import BookingRefDropdownContent from 'frontend/components/renderings/BookingDownloadBanner/components/DropdownContent/BookingRefDropdownContent';

import styles from './MultipleFlightReferenceItem.module.scss';

export type TMultipleFlightReferenceFields = {
    scrollToSeeFullReferences?: ISitecoreField<string>;
};

type TMultipleFlightReferenceItemProps = {
    flights: IRoute[];
    scrollToSeeFullReferences?: ISitecoreField<string>;
};

const MultipleFlightReferenceItem: FC<TMultipleFlightReferenceItemProps> = ({ flights, scrollToSeeFullReferences }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    const onLinkClick = (e: MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        const { href } = e.target as HTMLAnchorElement;

        if (!href?.includes('#')) {
            return;
        }

        const section = document.getElementById(href.split('#')[1]);

        if (!section) return;

        const offset = (document.getElementById('page-nav') as Nullable<HTMLElement>)?.offsetHeight || 0;

        scrollToElement(section, offset);
    };

    return (
        <div className={styles.multipleRefsContainer}>
            <div className={styles.multipleRefs}>
                <div className={styles.refTitleWrapper}>
                    <span data-tid='multiple-ref-title' className={styles.title}>
                        {getPhrase(SitecoreDictionary.BookingHeaderLabelsFlightReferences)}
                    </span>
                    <Callout
                        className='ms-2'
                        content={
                            <RichTextDictionary
                                dictionaryKey={SitecoreDictionary.BookingHeaderLabelsMultipleFlightRefTitle}
                                className={styles.tooltipText}
                            />
                        }
                        orientation={CalloutOrientation.Top}
                        position={CalloutPosition.IconLeft}
                        isShownOnHover
                    >
                        <i className='more-info' data-tid='multiple-ref-more-info-icon'>
                            <SvgInfoLined />
                        </i>
                    </Callout>
                </div>
                <Callout
                    position={CalloutPosition.Center}
                    orientation={CalloutOrientation.Bottom}
                    className={styles.callout}
                    drawerTitleClassName={styles.drawerTitle}
                    isDrawerVariant={!isMoreThenTabletViewport}
                    drawerTitle={{ value: getPhrase(SitecoreDictionary.BookingHeaderLabelsMultipleFlightReferences) }}
                    isCTAOutlined
                    footerClassName={styles.drawerFooter}
                    content={
                        <BookingRefDropdownContent
                            bookingRoutes={flights}
                            helpText={isMoreThenTabletViewport ? scrollToSeeFullReferences : undefined}
                            onLinkClick={onLinkClick}
                        />
                    }
                >
                    <ReferenceItem
                        dataTid='multiple-flight-ref'
                        title={getPhrase(SitecoreDictionary.BookingHeaderLabelsFlightReferences)}
                        titleClassName={styles.noTitle}
                        refNumberClassName={styles.refNumberBox}
                    >
                        {getPhrase(SitecoreDictionary.BookingHeaderLabelsMultipleReferences)}
                        <SvgChevronDown />
                    </ReferenceItem>
                </Callout>
            </div>

            <RichTextWithLinks
                field={scrollToSeeFullReferences}
                className={styles.scrollInfo}
                onLinkClick={onLinkClick}
            />
        </div>
    );
};

export default observer(MultipleFlightReferenceItem);
