import { FunctionComponent } from 'react';
import { ComponentRendering, Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { usePoster } from 'frontend/hooks/usePoster';
import useStore from 'frontend/hooks/useStore';
import { filterPlaceholdersByIndex } from 'frontend/utils/layout.utils';
import { ExportFileTypes } from 'models/enum/ExportFileTypes';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { IPosterError } from 'frontend/components/common/Poster';
import * as Poster from 'frontend/components/common/Poster';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import { IExportButtonsFields } from 'frontend/components/renderings/ExportButtons/ExportButtons';

import styles from './PosterContent.module.scss';

export interface IPosterContentProps {
    fields: IExportButtonsFields;
    rendering: ComponentRendering;
    UMLogoImage?: string;
    id?: string;
    index?: number;
}

export const PosterContent: FunctionComponent<IPosterContentProps> = ({
    fields,
    rendering,
    id = 'default',
    index = 0,
    UMLogoImage,
}) => {
    const { hotelInfo, getPhrase } = useStore(stores => ({
        hotelInfo: stores.bookingStore.hotel,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { posterId, hasEjLogo, downloadPoster, toggleEjLogo, hasUMLogo, toggleUMLogo } = usePoster();

    if (!fields || !hotelInfo?.name) {
        return null;
    }

    const { name } = hotelInfo;
    const { ExportPromoLabel, ExportPromoTooltip, LogoImage, Title, Description, ExportAsImage, HideDownloadButton } =
        fields;

    if (!ExportPromoLabel) {
        return null;
    }

    const errorInfo: IPosterError = {
        title: getPhrase(SitecoreDictionary.BookingFailedTitlesSomethingWentWrong),
        errorMessage: getPhrase(SitecoreDictionary.BookingFailedLabelsPDFFailedDescription),
        button: getPhrase(SitecoreDictionary.BookingFailedButtonsTryAgain),
    };
    const renderingByIndex = filterPlaceholdersByIndex(rendering, PlaceholderNames.PosterInner, index);

    return (
        <>
            <div className={styles.triggerWrapper} data-tid='hotel-poster'>
                <Poster.Trigger id={id}>
                    <Button className={styles.promoButton} data-tid='hotel-poster-download' isText>
                        {<Text tag='span' field={ExportPromoLabel} />}
                    </Button>
                </Poster.Trigger>
                {!!ExportPromoTooltip?.value && (
                    <Tooltip placement='right'>
                        <TooltipTrigger className={styles.icon} />
                        <TooltipContent>
                            <Text field={ExportPromoTooltip} />
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            <Poster.Content
                id={id}
                {...fields}
                UMLogoImage={UMLogoImage}
                posterName={name}
                type={!!ExportAsImage?.value ? ExportFileTypes.PNG : ExportFileTypes.PDF}
                hasLargeFormat={false}
                hideButtons={!!HideDownloadButton?.value}
            >
                <div className={styles.container}>
                    <div className={styles.info}>
                        {Title && <Text tag='h2' field={Title} className={styles.title} data-tid='poster-title' />}
                        {Description && (
                            <Text
                                tag='div'
                                field={Description}
                                className={styles.description}
                                data-tid='poster-description'
                            />
                        )}
                    </div>
                    <Placeholder
                        name={PlaceholderNames.PosterInner}
                        rendering={renderingByIndex}
                        posterId={posterId}
                        hasEjLogo={hasEjLogo}
                        hasUMLogo={hasUMLogo}
                        downloadPoster={downloadPoster}
                        toggleEjLogo={toggleEjLogo}
                        toggleUMLogo={toggleUMLogo}
                        logoImage={LogoImage}
                        UMLogoImage={UMLogoImage}
                        posterFields={fields}
                        posterName={name}
                    />
                </div>
            </Poster.Content>
            <Poster.Error {...errorInfo} />
        </>
    );
};

export default observer(PosterContent);
