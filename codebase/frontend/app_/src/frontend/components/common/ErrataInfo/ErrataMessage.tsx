import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import ChevronDown from 'frontend/components/icons-new/ChevronDown';

import useReadMoreButton from './ErrataMessage.utils';

import styles from './ErrataMessage.module.scss';

export interface IErrataMessageProps {
    className?: string;
    errataInfo?: string[];
    facilityErratas?: string[];
    flightErratas?: string[];
}

export const ErrataMessage: React.FC<IErrataMessageProps> = ({
    errataInfo = [],
    flightErratas = [],
    className,
    facilityErratas,
}) => {
    const { isErrataEnabled, isFacilityErrataEnabled, getSetting, getPhrase } = useStore(stores => ({
        isErrataEnabled: stores.layoutStore.isErrataEnabled,
        isFacilityErrataEnabled: stores.layoutStore.isFacilityErrataEnabled,
        getSetting: stores.layoutStore.getSetting,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const {
        isButtonRendered,
        onClick: onToggleExpand,
        isExpanded,
    } = useReadMoreButton({
        wrapperId: 'errata-message-wrapper',
        contentId: 'errata-content-wrapper',
        excludeId: 'errata-btn-wrapper',
    });

    const errataInfoList: string[] = isErrataEnabled && errataInfo && errataInfo.length > 0 ? [...errataInfo] : [];
    const flightErratasList: string[] =
        isErrataEnabled && flightErratas && flightErratas.length > 0 ? [...flightErratas] : [];

    if (isFacilityErrataEnabled && facilityErratas?.length) {
        errataInfoList.push(...facilityErratas);
    }

    const iconUrl = cmsUrls.media(getSetting(SiteSettings.ErrataIcon));
    const iconFlightUrl = cmsUrls.media(getSetting(SiteSettings.ErrataFlightIcon));

    const renderErrataItemHtml = (html: string): JSX.Element => (
        <div className='errata-message__item' dangerouslySetInnerHTML={{ __html: html }} />
    );

    const renderFlightErratas = (): JSX.Element => {
        if (flightErratasList.length === 1) {
            return <div className='errata-message__items'>{renderErrataItemHtml(flightErratasList[0])}</div>;
        }

        return (
            <ul className='list list--bullet errata-message__items'>
                {flightErratasList.map((itemHtml, i) => (
                    <li key={i}>{renderErrataItemHtml(itemHtml)}</li>
                ))}
            </ul>
        );
    };

    const renderErrataInfo = (): JSX.Element => {
        if (errataInfoList.length === 1) {
            return <div className='errata-message__items'>{renderErrataItemHtml(errataInfoList[0])}</div>;
        }

        return (
            <ul className='list list--bullet errata-message__items'>
                {errataInfoList.map((itemHtml, i) => (
                    <li key={i}>{renderErrataItemHtml(itemHtml)}</li>
                ))}
            </ul>
        );
    };

    if (errataInfoList.length === 0 && flightErratasList.length === 0) {
        return null;
    }

    return (
        <>
            {!!errataInfoList.length && (
                <div
                    id='errata-message-wrapper'
                    className={classNames('errata-message', className, styles.wrapper, {
                        [styles.expanded]: isExpanded,
                    })}
                >
                    <h2 className='errata-message__title'>
                        {iconUrl && (
                            <span
                                className='errata-message__icon icon--bg-image'
                                style={{ backgroundImage: `url(${iconUrl})` }}
                            />
                        )}
                        {getSetting(SiteSettings.ErrataTitle)}
                    </h2>

                    <div id='errata-content-wrapper' className={styles.contentWrapper}>
                        {renderErrataInfo()}
                    </div>

                    {isButtonRendered && (
                        <div id='errata-btn-wrapper' className={styles.btnWrapper} data-tid='errata-read-more-button'>
                            <button className={styles.btn} onClick={onToggleExpand}>
                                {getPhrase(
                                    isExpanded
                                        ? SitecoreDictionary.GlobalsButtonsReadLess
                                        : SitecoreDictionary.GlobalsButtonsReadMore,
                                )}

                                <i className={styles.chevron}>
                                    <ChevronDown />
                                </i>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!!flightErratasList.length && (
                <div className={classNames('errata-message errata-message-list', className)}>
                    <h2 className='errata-message__title'>
                        {iconFlightUrl && (
                            <span
                                className='errata-message__icon icon--bg-image'
                                style={{ backgroundImage: `url(${iconFlightUrl})` }}
                            />
                        )}
                        {getSetting(SiteSettings.ErrataFlightTitle)}
                    </h2>
                    {renderFlightErratas()}
                </div>
            )}
        </>
    );
};

export default observer(ErrataMessage);
