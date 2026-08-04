using easyJet.Foundation.SitecoreExtensions.Commands;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class AccommodationUpdateSubMenuContainerCommand : BaseSubMenuContainerCommand
    {
        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Destinations.Constants.TemplateIds.Country)
                   || context.Items[0].TemplateID.Equals(Destinations.Constants.TemplateIds.Accommodation)
                   && !string.IsNullOrEmpty(context.Items[0].Fields[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode]?.Value);
        }
    }
}