import React, { useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import bookingService from 'frontend/services/booking.service';
import { isHolidayStore } from 'frontend/store/holidays';
import { getIDestinationByCode } from 'frontend/utils/destinations.utils';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IDestinationFields } from 'models/data/IDestinationFields';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { MediaSize } from 'models/data/MediaSizeParams';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IComponentWithRerenderProps, withRerender } from 'frontend/components/hoc/withRerender';

import PopUnderOfferOptions, { IPopUnderOfferFields } from './components/PopUnderOfferOptions';

import styles from './PopUnder.module.scss';

interface IPopUnderFields {
    BottomMark: ISitecoreField<string>;
    ButtonText: ISitecoreField<string>;
    DestinationBottomMark: ISitecoreField<string>;
    DestinationButtonText: ISitecoreField<string>;
    DestinationOfferSection: ISitecoreChildren<IPopUnderOfferFields>[];
    DestinationSubtitle: ISitecoreField<string>;
    DestinationTitle: ISitecoreField<string>;
    ExcludedDestinationsList: ISitecoreCompositeField<IDestinationFields>[];
    Image: ISitecoreField<ISitecoreImage>;
    OfferSection: ISitecoreChildren<IPopUnderOfferFields>[];
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

interface IPopUnderProps extends ISitecoreComponent<IPopUnderFields>, IComponentWithRerenderProps {}

export const PopUnder = ({ fields, wasRerendered }: IPopUnderProps) => {
    const {
        Title,
        Subtitle,
        ButtonText,
        BottomMark,
        Image,
        OfferSection,
        DestinationTitle,
        DestinationSubtitle,
        DestinationButtonText,
        DestinationOfferSection,
        ExcludedDestinationsList,
        DestinationBottomMark,
    } = fields || {};
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [imageObject, setImageObject] = useState<ISitecoreField<ISitecoreImage> | undefined>(Image);
    const {
        isScreenLessMedium,
        isEditMode,
        utmParams,
        shouldShowPopunder,
        updateOrder,
        fetchOffers,
        destinationsWithNames,
        selectedDestinationCodes,
        selectedParentDestinationCodesQuery,
        wasPopunderShown,
        setWasPopunderShown,
        toggleNotifications,
        isAskNotificationsPostponed,
    } = useStore(stores => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        isEditMode: stores.layoutStore.isEditMode,
        utmParams: stores.queryParamStore.utmParams,
        shouldShowPopunder: stores.queryParamStore.shouldShowPopunder,
        updateOrder: stores.searchStore.updateOrder,
        fetchOffers: stores.hotelsStore.fetchOffers,
        selectedDestinationCodes: stores.rootStore.searchStore.searchTo.selectedDestinationCodes,
        wasPopunderShown: stores.appStore.wasPopunderShown,
        setWasPopunderShown: stores.appStore.setWasPopunderShown,
        selectedParentDestinationCodesQuery: stores.rootStore.searchStore.searchTo.selectedParentDestinationCodesQuery,
        destinationsWithNames: stores.rootStore.searchStore.searchTo.destinationsWithNames,
        toggleNotifications: isHolidayStore(stores) ? stores.notificationsStore.toggleNotifications : null,
        isAskNotificationsPostponed: isHolidayStore(stores)
            ? stores.notificationsStore.isAskNotificationsPostponed
            : false,
    }));

    const onClosePopup = () => {
        // INS-364: Delay Push notification pop-up from Airlines PopUnder
        if (isAskNotificationsPostponed) {
            toggleNotifications?.();
        }

        setShowPopup(false);

        // EJH-14673: load bd4 recommendations only when user closes the popunder
        updateOrder(OrderBy.Recommended, OrderDirection.Default);
        fetchOffers(true);
        setWasPopunderShown(true);
    };

    // get destination from store, if are multiple Regions, get Country
    const selectedDestinationCodeValue =
        // Check for EE (selectedDestinationCodes is undefined)
        selectedDestinationCodes?.length > 1
            ? selectedParentDestinationCodesQuery || ''
            : selectedDestinationCodes?.[0] || '';

    // get destination info as code, name, parent
    const destination = getIDestinationByCode(destinationsWithNames, selectedDestinationCodeValue);

    // matching destination between query & sitecore content
    const checkIfSearchingMatchDestination = (): boolean => {
        const excludedDestinationsListCode = ExcludedDestinationsList?.map(item => item.fields?.Code);
        const isInExcludedDestinationList = excludedDestinationsListCode?.some(
            destinationCode => destinationCode.value === selectedDestinationCodeValue,
        );
        const isDestinationMatched = destinationsWithNames?.some(
            destination => destination.code === selectedDestinationCodeValue,
        );

        return !isEditMode && isDestinationMatched && !isInExcludedDestinationList;
    };

    const textContentClassNames = classNames(
        styles.popUnderTextContent,
        checkIfSearchingMatchDestination()
            ? !DestinationBottomMark?.value && styles.popUnderContentPadding
            : !BottomMark?.value && styles.popUnderContentPadding,
    );

    useEffect(() => {
        // if destination match - get the image (from WEB API)
        if (destinationsWithNames.filter(dest => typeof dest !== 'undefined').length > 0) {
            if (checkIfSearchingMatchDestination()) {
                const getDestinationImage = async () => {
                    const destinationImageResponse = await bookingService.loadDestinationImage(
                        selectedDestinationCodeValue,
                    );

                    if (destinationImageResponse) {
                        setImageObject({ value: { src: destinationImageResponse } });
                    }

                    setShowPopup(shouldShowPopunder(utmParams));
                };
                getDestinationImage().catch(console.error);
            } else {
                setShowPopup(shouldShowPopunder(utmParams));
            }
        }
    }, [destinationsWithNames]);

    // if the rendering conditions of this component change, this should be reflected in the condition
    // in the toggleNotificationsIfPopunderNotShown function from notificationsStore
    if (!fields || !wasRerendered || !showPopup || isScreenLessMedium || wasPopunderShown) {
        return null;
    }

    return (
        <Popup
            containerClass={styles.popUnderContainer}
            onClose={onClosePopup}
            showCloseButton
            dialogClass={styles.popUnderDialog}
            contentClass={styles.popUnderContent}
            bodyClass={styles.popUnderBody}
        >
            <div
                data-tid='popunder-background'
                className={styles.popUnderBackground}
                style={getSitecoreImageBackgroundStyles(
                    checkIfSearchingMatchDestination() ? imageObject : Image,
                    MediaSize.Large,
                    isScreenLessMedium,
                    isEditMode,
                )}
            >
                <div className={textContentClassNames} data-tid='popunder-content'>
                    {!isEditMode && checkIfSearchingMatchDestination() ? (
                        <>
                            {!!DestinationTitle?.value && (
                                <h2 className={styles.popUnderTitle} data-tid='popunder-title'>
                                    {Tokenizer.replaceToken(DestinationTitle?.value, Tokens.Name, destination?.name)}
                                </h2>
                            )}
                            {!!DestinationSubtitle?.value && (
                                <p className={styles.popUnderSubtitle} data-tid='popunder-subtitle'>
                                    {Tokenizer.replaceToken(DestinationSubtitle?.value, Tokens.Name, destination?.name)}
                                </p>
                            )}
                            {!!DestinationOfferSection?.length && (
                                <PopUnderOfferOptions
                                    items={DestinationOfferSection}
                                    className={styles.popUnderOffers}
                                />
                            )}

                            <Button className={styles.popUnderButton} onClick={onClosePopup} data-tid='popunder-button'>
                                {DestinationButtonText?.value}
                            </Button>
                            {!!DestinationBottomMark?.value && (
                                <Text
                                    field={DestinationBottomMark}
                                    tag='p'
                                    className={styles.popUnderBottomMark}
                                    data-tid='popunder-bottom-text'
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {!!Title?.value && (
                                <Text
                                    field={Title}
                                    tag='h2'
                                    className={styles.popUnderTitle}
                                    data-tid='popunder-title'
                                />
                            )}
                            {!!Subtitle?.value && (
                                <RichTextWithLinks
                                    field={Subtitle}
                                    tag='p'
                                    className={styles.popUnderSubtitle}
                                    dataId='popunder-subtitle'
                                />
                            )}
                            {!!OfferSection?.length && (
                                <PopUnderOfferOptions items={OfferSection} className={styles.popUnderOffers} />
                            )}

                            <Button className={styles.popUnderButton} onClick={onClosePopup} data-tid='popunder-button'>
                                {ButtonText?.value}
                            </Button>
                            {!!BottomMark?.value && (
                                <Text
                                    field={BottomMark}
                                    tag='p'
                                    className={styles.popUnderBottomMark}
                                    data-tid='popunder-bottom-text'
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </Popup>
    );
};

export default withRerender(observer(PopUnder));
