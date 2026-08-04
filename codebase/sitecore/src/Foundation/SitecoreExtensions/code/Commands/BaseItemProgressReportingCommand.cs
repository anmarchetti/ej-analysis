using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SitecoreExtensions.Switchers;
using Sitecore.Data.Items;
using Sitecore.Web.UI.Sheer;

[assembly: InternalsVisibleTo("easyJet.Foundation.Atcom.Tests")]
[assembly: InternalsVisibleTo("easyJet.Foundation.TripAdvisor.Tests")]
[assembly: InternalsVisibleTo("easyJet.Foundation.HotelBeds.Tests")]
[assembly: InternalsVisibleTo("easyJet.Foundation.Voucherify.Tests")]
[assembly: InternalsVisibleTo("easyJet.Feature.SitecoreEnhancment.Tests")]
[assembly: InternalsVisibleTo("easyJet.Feature.PageContent.Tests")]

namespace easyJet.Foundation.SitecoreExtensions.Commands
{
    public abstract class BaseItemProgressReportingCommand : BaseProgressReportingCommand<Item>
    {
        protected BaseItemProgressReportingCommand(IDatabaseProvider databaseProvider, ILogger logger, IUserCreationService userCreationService, ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
        }

        protected internal abstract IEnumerable<Item> ProcessItems(Item contextItem);

        protected internal override IEnumerable<Item> ProcessItems(Item contextItem, ClientPipelineArgs arg)
        {
            using (new LogSwitcher(Logger))
            {
                return ProcessItems(contextItem);
            }
        }

        protected override string GetStatusMessage(Item item)
            => $"{item.Template.Name}: {item.Name} has been successfully synchronized.<br>ID: {item.ID}<br>Path: {item.Paths.Path.Replace("/sitecore/content/EasyJet/Holidays/Home/Destinations", string.Empty).Replace("/sitecore/content/EasyJet", string.Empty)}";

        protected override string GetFinalStatusMessage(List<Item> processedItems)
        {
            if (!processedItems?.Any() ?? true)
            {
                return "No items have been synchronized.";
            }

            var groupedItemList = processedItems
                .GroupBy(u => u.TemplateName)
                .ToDictionary(g => g.Key, grp => grp.ToList());

            var sb = new StringBuilder();
            foreach (var templateName in groupedItemList.Keys)
            {
                sb.Append($"{groupedItemList[templateName].Count} {templateName}s<br>");
            }

            sb.Append("have been successfully synchronized");
            return sb.ToString();
        }
    }
}