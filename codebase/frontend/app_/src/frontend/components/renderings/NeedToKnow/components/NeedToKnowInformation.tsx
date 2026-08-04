import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { INeedToKnowInformation } from 'frontend/components/renderings/NeedToKnow/NeedToKnow';
import styles from 'frontend/components/renderings/NeedToKnow/NeedToKnow.module.scss';

const NeedToKnowInformation = ({ InformationContent, InformationIcon }: INeedToKnowInformation): JSX.Element => (
    <div className={styles.informationContainer} data-tid='need-to-know-information'>
        {!!InformationIcon?.value && (
            <div className={styles.imgWrapper} data-tid='need-to-know-information-icon-wrapper'>
                <JSSImageNext field={InformationIcon} width={36} height={36} data-tid='need-to-know-information-icon' />
            </div>
        )}
        {!!InformationContent?.value && (
            <RichTextWithLinks
                field={InformationContent}
                className={styles.informationContent}
                dataId='need-to-know-information-content'
            />
        )}
    </div>
);
export default NeedToKnowInformation;
