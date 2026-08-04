using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Voucherify.Tests.Infrastructure.DbItems
{
    public class PromotionDbItem : DbItem
    {
        public PromotionDbItem(string name, ID id)
            : base(name, id, Templates.Promotion.Id)
        {
            Add(Templates.Promotion.Fields.Airport, string.Empty);
            Add(Templates.Promotion.Fields.AirportErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.Board, string.Empty);
            Add(Templates.Promotion.Fields.BoardErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.Budget, string.Empty);
            Add(Templates.Promotion.Fields.DateRangeOfValidityErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.DateValidityFrom, string.Empty);
            Add(Templates.Promotion.Fields.DateValidityTo, string.Empty);
            Add(Templates.Promotion.Fields.DepartureDateErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.DepartureDateFrom, string.Empty);
            Add(Templates.Promotion.Fields.DepartureDateTo, string.Empty);
            Add(Templates.Promotion.Fields.Destination, string.Empty);
            Add(Templates.Promotion.Fields.DestinationErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.Duration, string.Empty);
            Add(Templates.Promotion.Fields.DurationErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.HolidayCardDescription, string.Empty);
            Add(Templates.Promotion.Fields.HolidayTheme, string.Empty);
            Add(Templates.Promotion.Fields.HolidayThemeErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.HolidayType, string.Empty);
            Add(Templates.Promotion.Fields.HolidayTypeErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.MinimumPriceErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.NumberOfAdults, string.Empty);
            Add(Templates.Promotion.Fields.NumberOfAdultsErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.NumberOfChildren, string.Empty);
            Add(Templates.Promotion.Fields.NumberOfChildrenErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.NumberOfInfants, string.Empty);
            Add(Templates.Promotion.Fields.NumberOfInfantsErrorCode, string.Empty);
            Add(Templates.Promotion.Fields.CustomerPromoCode, name);
            Add(Templates.Promotion.Fields.PromoBannerDescription, string.Empty);
            Add(Templates.Promotion.Fields.CardDescription, string.Empty);
            Add(Templates.Promotion.Fields.Icon, string.Empty);
            Add(Templates.Promotion.Fields.BannerTitle, string.Empty);
            Add(Templates.Promotion.Fields.MinimumSpend1, string.Empty);
            Add(Templates.Promotion.Fields.MinimumSpend2, name);
            Add(Templates.Promotion.Fields.MinimumSpend3, string.Empty);
            Add(Templates.Promotion.Fields.PromoCode, name);
            Add(Templates.Promotion.Fields.Date, string.Empty);
            Add(Templates.Promotion.Fields.TandCs, string.Empty);
            Add(Templates.Promotion.Fields.PromoCollections, string.Empty);
        }
    }
}