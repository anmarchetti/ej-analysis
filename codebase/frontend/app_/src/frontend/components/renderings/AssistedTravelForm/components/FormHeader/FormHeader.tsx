import { FC, useMemo } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { buildFlightPlusHotelUrl } from 'frontend/utils/url.utils';
import SitePath from 'models/enum/SitePath';
import PageHeader from 'frontend/components/common/PageHeader/PageHeader';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgChildCircleFilled from 'frontend/components/icons-new/ChildCircleFilled';
import SvgUserCircleFilled from 'frontend/components/icons-new/UserCircleFilled';
import { IFormHeaderFields } from 'frontend/components/renderings/AssistedTravelForm/models/interface';
import { PopupType, Screen } from 'frontend/components/renderings/AssistedTravelForm/models/types';
import { createOnContactUsClick } from 'frontend/components/renderings/AssistedTravelForm/utils/AssistedTravelForm.utils';

import styles from './FormHeader.module.scss';

export type TFormHeaderProps = {
    currentScreen: Screen;
    fields: IFormHeaderFields;
    togglePopup: (popup: PopupType | null) => void;
    currentSectionTitle?: string;
    currentStepInProgressBar?: number;
    customerFullName?: string;
    isAdult?: boolean;
    totalProgressBarSteps?: number;
};

const FormHeader: FC<TFormHeaderProps> = ({
    fields,
    currentScreen,
    customerFullName,
    isAdult,
    togglePopup,
    currentStepInProgressBar = 0,
    currentSectionTitle,
    totalProgressBarSteps = 0,
}) => {
    const { getBreadcrumb, pageBreadcrumbs, isFlightPlusHotelFunnel } = useStore(stores => ({
        getBreadcrumb: stores.layoutStore.getBreadcrumb,
        pageBreadcrumbs: stores.layoutStore.pageBreadcrumbs,
        isFlightPlusHotelFunnel: stores.queryParamStore.isFlightPlusHotelFunnel,
    }));

    const breadcrumbs = useMemo(() => {
        const page = pageBreadcrumbs.at(-1);
        const viewBookingBreadcrumb = getBreadcrumb(SitePath.ViewBooking);

        return [
            {
                key: viewBookingBreadcrumb.key,
                value: isFlightPlusHotelFunnel
                    ? buildFlightPlusHotelUrl(viewBookingBreadcrumb.value)
                    : viewBookingBreadcrumb.value,
            },
            {
                key: page?.key || '',
                value: page?.value || '',
            },
        ];
    }, [getBreadcrumb, pageBreadcrumbs, isFlightPlusHotelFunnel]);

    const onContactUsClick = createOnContactUsClick(togglePopup);

    const onBreadcrumbClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        togglePopup(PopupType.BackButtonWarning);
    };

    const { HeaderTitle, HeaderSubtitle, ProgressIndicator } = fields;

    const childrenBySection = (): JSX.Element | null => {
        switch (currentScreen) {
            case Screen.Introduction:
            case Screen.CustomerSelection:
                return (
                    <RichTextWithLinks
                        field={HeaderSubtitle}
                        className={styles.subtitle}
                        onLinkClick={onContactUsClick}
                        enableClickEventForEmptyLinks
                    />
                );
            case Screen.Summary:
            case Screen.DynamicSection: {
                if (!customerFullName) return null;

                const progressIndicatorText = Tokenizer.replaceTokens(ProgressIndicator.value, {
                    [Tokens.Value]:
                        currentScreen === Screen.DynamicSection
                            ? currentStepInProgressBar.toString()
                            : (totalProgressBarSteps + 1).toString(),
                    [Tokens.TotalAmount]: (totalProgressBarSteps + 1).toString(),
                });

                return (
                    <>
                        <div className={styles.ref} data-tid='customer-name'>
                            {isAdult ? (
                                <SvgUserCircleFilled className={styles.icon} />
                            ) : (
                                <SvgChildCircleFilled className={styles.icon} />
                            )}
                            <span>{customerFullName}</span>
                        </div>
                        {currentStepInProgressBar !== 0 && (
                            <span className={styles.sectionIndicator} data-tid='progress-indicator'>
                                <span className={styles.sectionIndex}>{progressIndicatorText}</span>
                                <span className={styles.currentSectionTitle}> - {currentSectionTitle}</span>
                            </span>
                        )}
                    </>
                );
            }
            default:
                return null;
        }
    };

    return (
        <PageHeader Title={HeaderTitle} breadcrumbs={breadcrumbs} onBreadcrumbClick={onBreadcrumbClick}>
            {childrenBySection()}
        </PageHeader>
    );
};

export default FormHeader;
