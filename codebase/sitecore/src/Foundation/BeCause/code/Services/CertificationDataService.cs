using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Models.Request;
using easyJet.Foundation.BeCause.Services.Api;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.BeCause.Services
{
    [Service(typeof(ICertificationDataService), Lifetime = Lifetime.Transient)]
    public class CertificationDataService : ICertificationDataService
    {
        private readonly IMasterDataService dataService;
        private readonly IBeCauseLogger logger;
        private readonly ISettingsService settingsService;

        public CertificationDataService(IMasterDataService dataService, IBeCauseLogger logger, ISettingsService settingsService)
        {
            this.dataService = dataService;
            this.logger = logger;
            this.settingsService = settingsService;
        }

        public (bool isFaulted, string errorMessage, HashSet<string> codes) GetCertifiedHotelIds()
        {
            try
            {
                var settings = settingsService.GetSettings();
                if (settings == null)
                {
                    throw new Exception($"{nameof(GetCertifiedHotelIds)} - Settings not found!");
                }

                if (!settings.IsEnabled)
                {
                    throw new Exception($"{nameof(GetCertifiedHotelIds)} - BeCause feature is disabled");
                }

                var certificates = settings.Certificates;
                if (certificates == null || !certificates.Any())
                {
                    throw new Exception("no certificates are configured");
                }

                if (certificates.Any(c => !Guid.TryParse(c, out _)))
                {
                    throw new Exception($"certificates contain some invalid guids - data: {string.Join(" , ", certificates)}");
                }

                logger.Info($"Fetching data for the following certificateIds:'{string.Join("', '", settings.Certificates ?? new HashSet<string>())}'", this);

                var selectedResultFieldNames = settings.SelectedResultFieldNames;
                if (selectedResultFieldNames == null || !selectedResultFieldNames.Any())
                {
                    throw new Exception("no field names are configured");
                }

                logger.Info($"Selecting the following field names:'{string.Join("', '", settings.SelectedResultFieldNames ?? new HashSet<string>())}'", this);

                var request = CreateCompaniesSearchRequest(certificates.ToArray());
                var response = dataService.GetCompaniesSearchResultAsync(request).GetAwaiter().GetResult();
                if (response == null)
                {
                    throw new Exception("Something went wrong - received null from data service");
                }

                if (!response.Companies.Any())
                {
                    throw new Exception("Something went wrong - response does not contain any companies");
                }

                var ids = response.Companies.SelectMany(c => c.Fields)
                    .Where(f => settings.SelectedResultFieldNames.Contains(f.Name))
                    .Select(f => f.Value)
                    .ToHashSet();

                logger.Info($"Received the following ids:{string.Join(",", ids.ToArray())} for field names:{string.Join(",", settings.SelectedResultFieldNames)}", this);
                return (false, string.Empty, ids);
            }
            catch (Exception exception)
            {
                logger.Error($"{nameof(GetCertifiedHotelIds)}", exception, this);
                return (true, exception.Message, null);
            }
        }

        private CompaniesSearchRequest CreateCompaniesSearchRequest(string[] certificates)
        {
            return new CompaniesSearchRequest
            {
                Certifications = certificates,
                IncludeCompanyAddress = false,
                IncludeExpiredData = false,
                IncludeNonValidatedData = false
            };
        }
    }
}