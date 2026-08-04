import AlertBanner from 'frontend/components/common/AlertBanner/AlertBanner';
import styles from 'frontend/components/renderings/RoomTypes/components/RoomCardInfo/RoomCardInfo.module.scss';

export interface IRoomCardInfoProps {
    isAlterationExtendedInfoVisible: boolean;
    isAlterationInfoVisible: boolean;
    isKidsInfoVisible: boolean;
    isScreenMedium: boolean;
    alterationExtendedInfoText?: string;
    alterationExtendedInfoTitle?: string;
    alterationInfoText?: string;
    alterationInfoTitle?: string;
    kidsInfoText?: string;
    kidsInfoTitle?: string;
}

enum InfoBannerTheme {
    Kids = 'Kids',
    Alteration = 'Alteration',
    AlterationExtended = 'AlterationExtended',
}

const RoomCardInfo = ({
    isAlterationInfoVisible,
    isAlterationExtendedInfoVisible,
    isKidsInfoVisible,
    isScreenMedium,
    alterationInfoTitle,
    alterationInfoText,
    alterationExtendedInfoTitle,
    alterationExtendedInfoText,
    kidsInfoTitle,
    kidsInfoText,
}: IRoomCardInfoProps) => {
    if (!isAlterationInfoVisible && !isAlterationExtendedInfoVisible && !isKidsInfoVisible) {
        return null;
    }

    const renderAlert = (theme: InfoBannerTheme) => {
        let dataTid;
        let title;
        let description;

        switch (theme) {
            case InfoBannerTheme.Alteration:
                title = alterationInfoTitle;
                description = alterationInfoText;
                dataTid = 'alteration-info-banner';
                break;
            case InfoBannerTheme.AlterationExtended:
                title = alterationExtendedInfoTitle;
                description = alterationExtendedInfoText;
                dataTid = 'alteration-extended-info-banner';
                break;
            case InfoBannerTheme.Kids:
                title = kidsInfoTitle;
                description = kidsInfoText;
                dataTid = 'kids-info-banner';
                break;
            default:
                break;
        }

        return !!title ? (
            <div className={styles.alert} data-tid={dataTid}>
                <AlertBanner title={title} description={description} collapsible={!isScreenMedium} isInline />
            </div>
        ) : null;
    };

    return (
        <>
            {isAlterationInfoVisible && renderAlert(InfoBannerTheme.Alteration)}
            {isAlterationExtendedInfoVisible && renderAlert(InfoBannerTheme.AlterationExtended)}
            {isKidsInfoVisible && renderAlert(InfoBannerTheme.Kids)}
        </>
    );
};

export default RoomCardInfo;
