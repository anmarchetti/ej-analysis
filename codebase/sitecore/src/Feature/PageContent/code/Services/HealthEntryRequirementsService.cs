using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.PageContent.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;

namespace easyJet.Feature.PageContent.Services
{
    [Service(typeof(IHealthEntryRequirementsService), Lifetime = Lifetime.Singleton)]
    public class HealthEntryRequirementsService : IHealthEntryRequirementsService
    {
        private readonly IHtmlCacheRepository cache;

        public HealthEntryRequirementsService(IHtmlCacheRepository cache)
        {
            this.cache = cache;
        }

        /// <inheritdoc/>
        public IEnumerable<HealthEntryRequirementTile> Get(string airportCode)
        {
            var data = cache.GetOrAdd($"PageContent.Cache.GetHealthEntryRequirementByAirport-{airportCode}", () =>
            {
                var requirementsBlocks = GetAll();

                // If can not find health/entry requirements by airport code, get default health/entry requirements.
                var requirementsBlock = requirementsBlocks.FirstOrDefault(x => x.AirportCodes.Contains(airportCode));
                if (requirementsBlock != null)
                {
                    return requirementsBlock.HealthEntryRequirements;
                }

                // Get default health/entry requirement block
                var requirementBlockItem = Context.Database.SelectSingleItem($"{Context.Site.RootPath}/Data/*[@@templateId='{Constants.TemplateIds.HealthEntryRequirementFolder}' and @@name='{Constants.ItemNames.HealthEntryRequirementsFolder}']/*[@@templateId='{Constants.TemplateIds.HealthEntryRequirementsBlock}' and @{Constants.Fields.HealthEntryRequirementsBlock.IsDefault} = '1']");

                if (requirementBlockItem != null)
                {
                    return requirementBlockItem.GetItems(Constants.Fields.HealthEntryRequirementsBlock.HealthEntryRequirements).Select(x => new HealthEntryRequirementTile(x));
                }

                return Enumerable.Empty<HealthEntryRequirementTile>();
            });

            return data;
        }

        /// <inheritdoc/>
        public IEnumerable<HealthEntryRequirementTile> GetFlightAndHotelHealthEntryRequirements(string airportCode)
        {
            var data = cache.GetOrAdd($"PageContent.Cache.GetFlightAndHotelHealthEntryRequirementByAirport-{airportCode}", () =>
            {
                var requirementsBlocks = GetAllFlightAndHotelHealthEntryRequirements();

                // If no explicit airport match is found, fallback to the folder default block.
                var requirementsBlock = requirementsBlocks.FirstOrDefault(x => x.AirportCodes.Contains(airportCode));
                if (requirementsBlock != null)
                {
                    return requirementsBlock.HealthEntryRequirements;
                }

                var requirementBlockItem = Context.Database.SelectSingleItem($"{Context.Site.RootPath}/Data/*[@@templateId='{Constants.TemplateIds.HealthEntryRequirementFolder}' and @@name='{Constants.ItemNames.FlightAndHotelHealthEntryRequirementsFolder}']/*[@@templateId='{Constants.TemplateIds.HealthEntryRequirementsBlock}' and @{Constants.Fields.HealthEntryRequirementsBlock.IsDefault} = '1']");

                if (requirementBlockItem != null)
                {
                    return requirementBlockItem.GetItems(Constants.Fields.HealthEntryRequirementsBlock.HealthEntryRequirements).Select(x => new HealthEntryRequirementTile(x));
                }

                return Enumerable.Empty<HealthEntryRequirementTile>();
            });

            return data;
        }

        /// <inheritdoc/>
        public IEnumerable<HealthEntryRequirementBlock> GetAll()
        {
            var data = cache.GetOrAdd($"PageContent.Cache.GetAllHealthEntryRequirementBlocks", () =>
            {
                var requirementFolder = Context.Database.SelectSingleItem($"{Context.Site.RootPath}/Data/*[@@templateId='{Constants.TemplateIds.HealthEntryRequirementFolder}' and @@name='{Constants.ItemNames.HealthEntryRequirementsFolder}']");

                if (requirementFolder != null)
                {
                    var requirementsBlocks = requirementFolder
                        .GetChildren()
                        .Select(item => new HealthEntryRequirementBlock(item));

                    return requirementsBlocks;
                }

                return Enumerable.Empty<HealthEntryRequirementBlock>();
            });

            return data;
        }

        /// <inheritdoc/>
        public IEnumerable<HealthEntryRequirementBlock> GetAllFlightAndHotelHealthEntryRequirements()
        {
            var data = cache.GetOrAdd($"PageContent.Cache.GetAllFlightAndHotelHealthEntryRequirementBlocks", () =>
            {
                var requirementFolder = Context.Database.SelectSingleItem($"{Context.Site.RootPath}/Data/*[@@templateId='{Constants.TemplateIds.HealthEntryRequirementFolder}' and @@name='{Constants.ItemNames.FlightAndHotelHealthEntryRequirementsFolder}']");

                if (requirementFolder != null)
                {
                    var requirementsBlocks = requirementFolder
                        .GetChildren()
                        .Select(item => new HealthEntryRequirementBlock(item));

                    return requirementsBlocks;
                }

                return Enumerable.Empty<HealthEntryRequirementBlock>();
            });

            return data;
        }
    }
}