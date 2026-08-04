using System.Linq;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;

namespace easyJet.Foundation.Destinations.Pipelines.GetLayoutServiceContext
{
    public class AccommodationCodesDataContext : IGetLayoutServiceContextProcessor
    {
        private const string AccommodationCodesKey = "accommodationCodes";

        public void Process(GetLayoutServiceContextArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            if (args.ContextData.ContainsKey(AccommodationCodesKey) || args.RenderedItem == null)
            {
                return;
            }

            if (args.RenderedItem.TemplateID.Equals(Constants.TemplateIds.Accommodation))
            {
                args.ContextData.Add(AccommodationCodesKey, GetAccommodationCodes(args.RenderedItem));
            }
        }

        private string[] GetAccommodationCodes(Item accommodationItem)
        {
            var items = accommodationItem?.Children?.Where(x => x.TemplateID == Constants.TemplateIds.AccommodationRoomsFolder);
            return items?
                .Where(item => !string.IsNullOrEmpty(item[Constants.Fields.DatasourceItem.Code]))
                .Select(item => item[Constants.Fields.DatasourceItem.Code]).ToArray();
        }
    }
}