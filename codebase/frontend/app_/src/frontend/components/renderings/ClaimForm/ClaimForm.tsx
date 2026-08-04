import { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

import ClaimFullOverviewPopup from './components/ClaimFullOverviewPopup/ClaimFullOverviewPopup';
import ItemsColumn from './components/ItemsColumn/ItemsColumn';
import { IClaimFormFields } from './interfaces';

import styles from './ClaimForm.module.scss';

export type TClaimFormProps = ISitecoreComponent<IClaimFormFields>;

const ClaimForm: FC<TClaimFormProps> = ({ fields }) => {
    const [isFullOverviewPopupShown, setIsFullOverviewPopupShown] = useState(false);

    if (!fields) {
        return null;
    }

    const {
        EligibleItems,
        EligibleItemsDescription,
        EligibleItemsSectionTitle,
        FormIcon,
        FormTitle,
        InstructionsSectionDescription,
        InstructionsSectionTitle,
        NotEligibleItems,
        NotEligibleItemsDescription,
        NotEligibleItemsSectionTitle,
        OpenFormButtonLabel,
        OpenFormButtonLink,
        SeeFullOverviewButtonLabel,
        FullOverviewPopupTitle,
        FullOverviewPopupDescription,
        FullOverviewPopupIcon,
        EnableFullOverviewPopup,
        InstructionsSectionAdditionalDescription,
    } = fields;

    return (
        <>
            <div className={styles.claimForm} data-tid='claim-form'>
                <div data-tid='header' className={styles.header}>
                    <JSSImage field={FormIcon} className={styles.icon} dataTid='claim-form-icon' />
                    <Text field={FormTitle} tag='h3' className={styles.title} data-tid='claim-form-title' />
                </div>
                <div className={styles.bodyContainer}>
                    <div className={styles.itemsContainer}>
                        <div data-tid='content' className={styles.itemsColumns}>
                            <ItemsColumn
                                items={EligibleItems}
                                title={EligibleItemsSectionTitle}
                                description={EligibleItemsDescription}
                                isEligibleColumn
                            />
                            <ItemsColumn
                                items={NotEligibleItems}
                                title={NotEligibleItemsSectionTitle}
                                description={NotEligibleItemsDescription}
                            />
                        </div>
                        {EnableFullOverviewPopup.value && (
                            <Button
                                data-tid='open-full-overview-button'
                                className={styles.btnExample}
                                isOutlined
                                onClick={(): void => setIsFullOverviewPopupShown(true)}
                            >
                                {SeeFullOverviewButtonLabel.value}
                            </Button>
                        )}
                    </div>
                    <div data-tid='instructions-section' className={styles.instructionsSection}>
                        <Text field={InstructionsSectionTitle} tag='h4' className={styles.title} data-tid='title' />
                        <div className={styles.content}>
                            <div className={styles.descriptionWrapper}>
                                <RichTextWithLinks
                                    field={InstructionsSectionDescription}
                                    tag='div'
                                    className={styles.description}
                                    dataId='instructions-section-description'
                                />
                                <RichTextWithLinks
                                    field={InstructionsSectionAdditionalDescription}
                                    tag='div'
                                    className={styles.additionalDescription}
                                    dataId='instructions-section-additional-description'
                                />
                            </div>
                            <RouterLink
                                dataId='open-form-link'
                                link={OpenFormButtonLink}
                                className={classNames(`btn`, styles.btnOpenForm)}
                            >
                                {OpenFormButtonLabel.value}
                            </RouterLink>
                            <RichTextWithLinks
                                field={InstructionsSectionAdditionalDescription}
                                tag='div'
                                className={styles.additionalDescriptionMobile}
                                dataId='instructions-section-additional-description-mobile'
                            />
                        </div>
                    </div>
                </div>
            </div>
            {EnableFullOverviewPopup.value && (
                <ClaimFullOverviewPopup
                    isPopupShown={isFullOverviewPopupShown}
                    onClose={(): void => setIsFullOverviewPopupShown(false)}
                    title={FullOverviewPopupTitle}
                    content={FullOverviewPopupDescription}
                    icon={FullOverviewPopupIcon}
                />
            )}
        </>
    );
};

export default ClaimForm;
