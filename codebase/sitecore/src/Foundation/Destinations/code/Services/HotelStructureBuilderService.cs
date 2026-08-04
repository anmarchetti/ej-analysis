using System;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IHotelStructureBuilderService), Lifetime = Lifetime.Transient)]
    public class HotelStructureBuilderService : IHotelStructureBuilderService
    {
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IExpediaHotelContentResolverService expediaHotelContentResolverService;
        private readonly IDestinationsLogger logger;

        public HotelStructureBuilderService(IDatasourceRepository datasourceRepository, IDatabaseProvider databaseProvider, IExpediaHotelContentResolverService expediaHotelContentResolverService, IDestinationsLogger logger)
        {
            this.datasourceRepository = datasourceRepository;
            this.databaseProvider = databaseProvider;
            this.expediaHotelContentResolverService = expediaHotelContentResolverService;
            this.logger = logger;
        }

        public Item CreateHotel(UpsertHotelRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var resortItem = ResolveExistingResort(request);
            var branchTemplate = GetHotelBranchTemplate();

            return datasourceRepository.GetOrCreateFromHotelBranchTemplate(request.Name, resortItem, branchTemplate, lockItem: false);
        }

        private static string RequireCode(string code, string entityName, string message)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                throw new InvalidOperationException($"{entityName} code is required. {message}");
            }

            return code.Trim();
        }

        private BranchItem GetHotelBranchTemplate()
        {
            var path = Settings.GetSetting("Destinations.HotelBranchTemplatePath");

            var database = databaseProvider.GetDatabase(DatabaseType.Master) ?? throw new InvalidOperationException("Master database is not available.");

            var branchItem = database.GetItem(path) ?? throw new InvalidOperationException($"Hotel branch template not found at path: {path}");

            return new BranchItem(branchItem);
        }

        private Item ResolveExistingResort(UpsertHotelRequest request)
        {
            var resortCode = RequireCode(request?.Resort?.Code, "Resort", "Cannot create hotel without Resort Code.");

            var existingResort = expediaHotelContentResolverService.ResolveResortByCode(resortCode);

            if (existingResort != null)
            {
                return existingResort;
            }

            var message = $"Cannot create Expedia hotel because resort with code '{resortCode}' does not exist in Sitecore. " +
                          $"GiataCode: '{request?.GiataCode}', HotelName: '{request?.Name}'.";

            logger.Error(message, this);

            throw new InvalidOperationException(message);
        }
    }
}
