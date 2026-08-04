using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Item = Sitecore.Data.Items.Item;

namespace easyJet.Foundation.BeCause.Services
{
    [Service(typeof(ICertificationSynchronisationService), Lifetime = Lifetime.Transient)]
    public class CertificationSynchronisationService : ICertificationSynchronisationService
    {
        private readonly ICertificationDataService certificationDataService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IBeCauseLogger logger;

        public CertificationSynchronisationService(IBeCauseLogger logger, ICertificationDataService certificationDataService, IDestinationsRepository destinationsRepository, IDatabaseProvider databaseProvider)
        {
            this.logger = logger;
            this.certificationDataService = certificationDataService;
            this.destinationsRepository = destinationsRepository;
            this.databaseProvider = databaseProvider;
        }

        public IEnumerable<CertificationSynchronisationResult> Synchronize(string startPath)
        {
            logger.Info($"Starting Synchronisation on '{startPath}'", this);
            yield return new CertificationSynchronisationResult() { Operation = SynchronizationOperation.UiMessage, Message = "Fetching Certified Hotels..." };
            var certifiedHotelCodes = certificationDataService.GetCertifiedHotelIds();

            if (certifiedHotelCodes.isFaulted)
            {
                yield return new CertificationSynchronisationResult() { Hotel = null, Operation = SynchronizationOperation.Error, Message = certifiedHotelCodes.errorMessage };
                yield break;
            }

            if (certifiedHotelCodes.codes == null)
            {
                yield return new CertificationSynchronisationResult() { Hotel = null, Operation = SynchronizationOperation.Error, Message = $"{nameof(Synchronize)}-{nameof(certificationDataService.GetCertifiedHotelIds)} returned null" };
                yield break;
            }

            yield return new CertificationSynchronisationResult() { Operation = SynchronizationOperation.UiMessage, Message = $"{certifiedHotelCodes.codes.Count} Certified Hotels Loaded" };

            var hotels = destinationsRepository.GetAllHotels(startPath);
            var processedHotelIds = new HashSet<ID>();

            foreach (var hotel in hotels)
            {
                if (!processedHotelIds.Add(hotel.Document.ItemId))
                {
                    logger.Warn($"Hotel '{hotel.Document.ItemId}' appeared more than once in search results — skipping duplicate.", this);
                    continue;
                }

                var hotelItem = databaseProvider.GetItem(hotel.Document.ItemId, DatabaseType.Master);

                var code = hotelItem?.Fields[Destinations.Constants.Fields.AccommodationItem.GiataCode]?.Value;
                if (string.IsNullOrWhiteSpace(code))
                {
                    logger.Warn($"Cannot resolve {Destinations.Constants.Fields.AccommodationItem.GiataCode} for hotel: '{hotelItem?.Paths.Path}'!", this);
                    continue;
                }

                var isCertified = certifiedHotelCodes.codes.Contains(code);
                var isCurrentlyCertified = IsCertified(hotelItem);
                switch (isCertified)
                {
                    case true when !isCurrentlyCertified:
                        yield return new CertificationSynchronisationResult() { Hotel = hotelItem, Operation = AddCertificate(hotelItem) ? SynchronizationOperation.CertificateAdded : SynchronizationOperation.Error };
                        continue;
                    case false when isCurrentlyCertified:
                        var result = RemoveCertificates(hotelItem);
                        yield return new CertificationSynchronisationResult() { Hotel = hotelItem, Operation = result ? SynchronizationOperation.CertificateRemoved : SynchronizationOperation.Error };
                        continue;
                    default:
                        yield return new CertificationSynchronisationResult() { Hotel = hotelItem, Operation = SynchronizationOperation.Untouched };
                        break;
                }
            }

            yield return new CertificationSynchronisationResult() { Operation = SynchronizationOperation.UiMessage, Message = "Synchronisation finished!" };
        }

        public string GetFinalStatusMessage(List<CertificationSynchronisationResult> processedItems)
        {
            var sb = new StringBuilder();

            var certificatesAddedCount = processedItems.Count(i => i.Operation.Equals(SynchronizationOperation.CertificateAdded));
            if (certificatesAddedCount > 0)
            {
                sb.AppendLine(certificatesAddedCount + " certificates added!");
            }

            var certificatesRemovedCount = processedItems.Count(i => i.Operation.Equals(SynchronizationOperation.CertificateRemoved));
            if (certificatesRemovedCount > 0)
            {
                sb.AppendLine(certificatesRemovedCount + " certificates removed!");
            }

            var hotelsUntouchedCount = processedItems.Count(i => i.Operation.Equals(SynchronizationOperation.Untouched));
            if (hotelsUntouchedCount > 0)
            {
                sb.AppendLine(hotelsUntouchedCount + " hotels had the correct state already!");
            }

            var errorsCount = processedItems.Count(i => i.Operation.Equals(SynchronizationOperation.Error));
            if (errorsCount > 0)
            {
                sb.AppendLine(errorsCount + " errors occurred!");
            }

            if (processedItems.All(i => i.Operation.Equals(SynchronizationOperation.Error) || i.Operation.Equals(SynchronizationOperation.UiMessage)))
            {
                foreach (var item in processedItems.Where(i => i.Operation.Equals(SynchronizationOperation.Error)))
                {
                    sb.AppendLine(item.Message);
                }
            }

            return sb.ToString();
        }

        private static Item GetFacilitiesFolder(Item hotelItem)
        {
            if (hotelItem == null)
            {
                return null;
            }

            return hotelItem.Children.FirstOrDefault(i => i.TemplateID.Equals(Constants.TemplateIds.AccomodationFacilitiesFolder));
        }

        private static Item GetEcoCertifiedItemByName(Item facilitiesFolder) =>
            facilitiesFolder.Children.FirstOrDefault(childItem => childItem.Name.Equals("Eco Certified", StringComparison.Ordinal));

        private static void SetCertificateFacilityFields(Item facility)
        {
            facility.Editing.BeginEdit();
            try
            {
                facility.Fields[Constants.FieldIds.FacilityType].Value = Constants.ItemIds.EcoCertifiedFacilityType.ToString();
                facility.Fields[Destinations.Constants.Fields.BaseAppearance.ShowOnSite].Value = Destinations.Constants.Common.CheckboxTrueValue;
                facility.Editing.EndEdit();
            }
            catch
            {
                facility.Editing.CancelEdit();
                throw;
            }
        }

        private bool RemoveCertificates(Item hotelItem)
        {
            var hasRemoved = false;

            var ecoFacility = GetEcoFacility(hotelItem);
            while (ecoFacility != null)
            {
                logger.Info($"Deleting certificate facility: '{ecoFacility.Paths.Path}:{ecoFacility.Uri}' for hotel:'{hotelItem.Paths.Path}'", this);
                ecoFacility.Delete();
                hasRemoved = true;
                ecoFacility = GetEcoFacility(hotelItem);
            }

            if (!hasRemoved)
            {
                logger.Warn($"Eco Facility not found for hotel: '{hotelItem.Paths.Path}'. removal aborted!", this);
            }

            return hasRemoved;
        }

        private bool AddCertificate(Item hotelItem)
        {
            var facilitiesFolder = GetOrCreateFacilitiesFolder(hotelItem);
            if (facilitiesFolder == null)
            {
                return false;
            }

            var alreadyExistingCertificate = GetEcoFacility(hotelItem);
            if (alreadyExistingCertificate != null)
            {
                logger.Warn($"Eco Facility {alreadyExistingCertificate.Paths.Path} already present in Facilities Folder for hotel:'{hotelItem.Paths.Path}'. Skipping...", this);
                return false;
            }

            var existingByName = GetEcoCertifiedItemByName(facilitiesFolder);
            if (existingByName != null)
            {
                logger.Warn($"Item named 'Eco Certified' ({existingByName.ID}) found for hotel:'{hotelItem.Paths.Path}' without a recognised FacilityType — repairing.", this);
                SetCertificateFacilityFields(existingByName);
                return true;
            }

            var facility = facilitiesFolder.Add("Eco Certified", Constants.TemplateIds.AccomodationFacility);
            logger.Info($"Adding certificate facility: '{facility.Paths.Path}:{facility.Uri}' for hotel:'{hotelItem.Paths.Path}'", this);
            SetCertificateFacilityFields(facility);
            return true;
        }

        private Item GetOrCreateFacilitiesFolder(Item hotelItem)
        {
            var facilitiesFolder = GetFacilitiesFolder(hotelItem);
            if (facilitiesFolder == null)
            {
                logger.Error($"Facilities Folder not found for hotel:'{hotelItem.Paths.Path}'. Creating new one...", this);
                return hotelItem.Add("Facilities", Constants.TemplateIds.AccomodationFacilitiesFolder);
            }

            return facilitiesFolder;
        }

        private bool IsCertified(Item hotelItem) => GetEcoFacility(hotelItem) != null;

        private Item GetEcoFacility(Item hotelItem)
        {
            var facilitiesFolder = GetFacilitiesFolder(hotelItem);
            if (facilitiesFolder == null)
            {
                return null;
            }

            foreach (Item facility in facilitiesFolder.Children)
            {
                if (facility == null)
                {
                    continue;
                }

                var facilityTypeField = facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.FacilityType];
                if (facilityTypeField == null || string.IsNullOrWhiteSpace(facilityTypeField.Value))
                {
                    continue;
                }

                if (!ID.TryParse(facilityTypeField.Value, out var facilityTypeId))
                {
                    continue;
                }

                // Fast path: AddCertificate tags every facility it creates with this canonical ID,
                // so we can match without loading the FacilityType item. Legacy/manually-added
                // facilities with other type IDs still fall through to the Code-based check below.
                if (facilityTypeId.Equals(Constants.ItemIds.EcoCertifiedFacilityType))
                {
                    return facility;
                }

                var facilityTypeItem = databaseProvider.GetItem(facilityTypeId, DatabaseType.Master);
                if (facilityTypeItem == null)
                {
                    continue;
                }

                var facilityFilteredType = new FacilityFilteredType(facilityTypeItem);
                if (facilityFilteredType.Code.Contains(Destinations.Constants.Fields.AccommodationFacilityItem.Eco))
                {
                    return facility;
                }
            }

            return null;
        }
    }
}
