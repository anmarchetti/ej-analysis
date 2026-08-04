import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { isIOS, isMobile } from 'frontend/utils/browser.utils';
import {
    buildGetDirectionsAppleMapsUrl,
    buildGetDirectionsGoogleMapsUrl,
    buildGetWhat3WordsUrl,
} from 'frontend/utils/map.utils';
import { TransferType } from 'models/enum/transfer/TransferType';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import Link from 'frontend/components/common/Link';
import { ILocation } from 'frontend/components/common/MapComponent/OldMap/MapDirectionsProptypes';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import SvgMapLined from 'frontend/components/icons-new/MapLined';
import SvgTaxiLined from 'frontend/components/icons-new/SvgTaxiLined';
import SvgTransferLined from 'frontend/components/icons-new/SvgTransferLined';
import { ITransferInstructionsPopupFields } from 'frontend/components/renderings/ItinerarySummary/interfaces';
import {
    formatLinksInText,
    formatPhoneNumbersAsLinks,
} from 'frontend/components/renderings/ItinerarySummary/utils/utils';

import styles from './TransferInstructionsPopup.module.scss';

export interface ITransferInstructionsPopupProps {
    CloseButtonLabel: ISitecoreField<string>;
    fields: ITransferInstructionsPopupFields;
    onClose: () => void;
    transferType: TransferType;
    instructions?: string;
    mapLocation?: ILocation;
    popupTitle?: ISitecoreField<string>;
    what3WordsLocation?: string;
}

const TransferInstructionsPopup: FC<ITransferInstructionsPopupProps> = ({
    instructions,
    mapLocation,
    popupTitle,
    what3WordsLocation,
    onClose,
    transferType,
    fields,
    CloseButtonLabel,
}) => {
    const isMobileDevice = isMobile();

    const instructionsWithFormatting = formatLinksInText(formatPhoneNumbersAsLinks(instructions || ''));

    const {
        AdditionalInstructions,
        InstructionsSubtitle,
        LocationsTitle,
        MapLocationButtonLabel,
        MapLocationDescription,
        ThreeWordsLocationButtonLabel,
        ThreeWordsLocationDescription,
        AppleMapLocationButtonLabel,
        GoogleMapLocationButtonLabel,
    } = fields;
    const popupIcon =
        transferType === TransferType.Private ? (
            <SvgTaxiLined className={styles.headerIcon} />
        ) : (
            <SvgTransferLined className={styles.headerIcon} />
        );

    const onChatBotLinkClick = (e: MouseEvent): void => {
        e.preventDefault();

        const shadowRoot = document.getElementById('gct-chatbot')?.shadowRoot;

        if (shadowRoot) {
            const chatbotDiv = shadowRoot.getElementById('chatbotContainer');

            const computedStyle = chatbotDiv && globalThis.getComputedStyle(chatbotDiv);

            if (computedStyle?.display === 'none') {
                window['toggleChatbot']?.();
            }

            onClose();
        }
    };

    const showLocationSection = (mapLocation?.latitude && mapLocation?.longitude) || what3WordsLocation;

    return (
        <FloatingPopup
            onClose={onClose}
            bodyClass={styles.bodyClass}
            footerClass={styles.footer}
            footerContent={
                <Button
                    onClick={onClose}
                    isOutlined
                    dataTid='transfer-instructions-popup-close-btn'
                    className={styles.closeBtn}
                >
                    {CloseButtonLabel.value}
                </Button>
            }
            id='transfer-instructions-popup'
        >
            <div className={styles.headerPopup}>
                {popupIcon}
                <Text field={popupTitle} className={styles.headerTitle} tag='h3' data-tid='popup-title' />
            </div>
            <div className={styles.instructionsContainer}>
                <Text
                    field={InstructionsSubtitle}
                    tag='span'
                    className={styles.title}
                    data-tid='instructions-subtitle'
                />
                <RichTextWithLinks field={{ value: instructionsWithFormatting }} tag='div' dataId='instructions' />
                <RichTextWithLinks
                    field={AdditionalInstructions}
                    tag='div'
                    onLinkClick={onChatBotLinkClick}
                    dataId='additional-instructions'
                />
            </div>
            {showLocationSection && (
                <div className={styles.locationsContainer}>
                    <div className={styles.locationsHeader}>
                        <SvgMapLined className={styles.mapIcon} />
                        <Text field={LocationsTitle} tag='div' className={styles.title} data-tid='locations-title' />
                    </div>
                    <div className={styles.locations}>
                        {mapLocation?.latitude && mapLocation?.longitude && (
                            <div className={styles.location}>
                                <RichTextWithLinks field={MapLocationDescription} dataId='map-location-description' />
                                <Link
                                    className={styles.button}
                                    href={buildGetDirectionsGoogleMapsUrl(mapLocation)}
                                    target='_blank'
                                    data-tid='google-maps-link'
                                    rel='noopener noreferrer'
                                >
                                    <Text
                                        field={isMobileDevice ? GoogleMapLocationButtonLabel : MapLocationButtonLabel}
                                        tag='span'
                                    />
                                    <SvgChevronRight className={styles.icon} />
                                </Link>
                                {isIOS() && (
                                    <Link
                                        className={styles.button}
                                        href={buildGetDirectionsAppleMapsUrl(mapLocation)}
                                        target='_blank'
                                        data-tid='apple-maps-link'
                                        rel='noopener noreferrer'
                                    >
                                        <Text field={AppleMapLocationButtonLabel} tag='span' />
                                        <SvgChevronRight className={styles.icon} />
                                    </Link>
                                )}
                            </div>
                        )}
                        {what3WordsLocation && (
                            <div className={styles.location}>
                                <RichTextWithLinks
                                    field={ThreeWordsLocationDescription}
                                    dataId='three-words-description'
                                />
                                <Link
                                    className={styles.button}
                                    href={buildGetWhat3WordsUrl(what3WordsLocation)}
                                    target='_blank'
                                    data-tid='three-words-link'
                                    rel='noopener noreferrer'
                                >
                                    <Text field={ThreeWordsLocationButtonLabel} tag='span' />
                                    <SvgChevronRight className={styles.icon} />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </FloatingPopup>
    );
};

export default TransferInstructionsPopup;
