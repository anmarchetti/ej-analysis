import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import SvgWarningFilledTransparent from 'frontend/components/icons-new/WarningFilledTransparent';

type TComponentProps = {
    isTradePortal?: boolean;
};

export const ValidationIcon: React.FC<TComponentProps> = ({ isTradePortal }) =>
    isTradePortal ? <SvgWarningFilledTransparent /> : <SvgWarningFilled />;
