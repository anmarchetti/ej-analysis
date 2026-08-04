import { ReactNode } from 'react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

import styles from './AncillariesRoute.module.scss';

export interface IAncillariesRouteFields {
    OutboundIcon: ISitecoreField<ISitecoreImage>;
    ReturnIcon: ISitecoreField<ISitecoreImage>;
}

export interface IAnclillariesRouteProps {
    children: ReactNode;
    fields: IAncillariesRouteFields;
    isOutbound?: boolean;
}

const AncillariesRoute = ({ isOutbound, fields, children }: IAnclillariesRouteProps) => {
    const { OutboundIcon, ReturnIcon } = fields;

    return (
        <div className={styles.route}>
            <div className={styles.routeRow}>
                <div className={styles.text} data-tid='ancillaries-route-text'>
                    <JSSImage data-tid='ancillaries-route-icon' field={isOutbound ? OutboundIcon : ReturnIcon} />
                    <RichTextDictionary
                        tag='span'
                        dictionaryKey={
                            isOutbound
                                ? SitecoreDictionary.SeatMapLabelsOutbound
                                : SitecoreDictionary.SeatMapLabelsReturn
                        }
                    />
                </div>
            </div>
            {children}
        </div>
    );
};

export default AncillariesRoute;
