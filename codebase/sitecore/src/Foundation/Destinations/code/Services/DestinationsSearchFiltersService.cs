using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Abstractions;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IDestinationsSearchFiltersService), Lifetime = Lifetime.Transient)]
    public class DestinationsSearchFiltersService : BatchSearchService, IDestinationsSearchFiltersService
    {
        private readonly IDestinationsSearchFiltersRepository repository;
        private readonly IFacilityMatrixService facilityMatrixService;
        private readonly int chunkSize;

        public DestinationsSearchFiltersService(BaseSettings settings, IDestinationsSearchFiltersRepository repository, IFacilityMatrixService facilityMatrixService)
        {
            this.repository = repository;
            this.facilityMatrixService = facilityMatrixService;
            chunkSize = settings.GetIntSetting("Destinations.ChunkSize", 50);
        }

        public IEnumerable<HotelFilters> GetFilters(string[] ids)
        {
            var chunks = ids.Chunk(chunkSize).ToList();
            var filters = BatchProcess(chunks, chunk => repository.GetAllFiltersByAccommodationCodes(chunk.ToList())).Select(x => x.Document);
            var result = SourcesSearchResultMapper.MapSourcesSearchResultByAtcomCodes(ids, filters, AccommodationMapper.MapFiltersFromSearchResultItem).ToList();
            facilityMatrixService.EnrichHotelFiltersFacilityMatrix(result);
            return result;
        }
    }
}