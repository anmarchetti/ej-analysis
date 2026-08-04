using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Extensions;
using easyJet.Holiday.IntegrationTests.Shared.Helpers;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Offers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Language;
using easyJet.Holiday.IntegrationTests.Shared.Models.Logging;
using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.IntegrationTests.TestApi.Attributes;
using Microsoft.Extensions.Options;
using System.Reflection;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.PackageOffers
{
    public class OffersBuilder(
        ISearchApi searchApi,
        IOptions<MarketSettings> marketSettings
            ) : IOffersBuilder
    {
        private readonly GetPackagesRequestFaker _packagesRequestFaker = new();
        private readonly MarketSettings _marketSettings = marketSettings?.Value ?? throw new ArgumentNullException(nameof(marketSettings));
        private readonly List<HttpLogs> _httpLogsStorage = [];

        private string _languageCookie = string.Empty;

        public IOffersBuilder ApplyCreationParameters(OfferSearchParams? creationParams)
        {
            if (creationParams is null)
            {
                return this;
            }

            var methods = this.GetType().GetMethods()
                .Where(x => x.GetCustomAttributes<CreationParameterAttribute>().Any());

            foreach (var property in creationParams.GetType().GetProperties())
            {
                var creationParamMethod = methods.FirstOrDefault(x => x.GetCustomAttribute<CreationParameterAttribute>()?.ParameterName == property.Name);
                if (creationParamMethod is null)
                {
                    continue;
                }

                var requiredParameters = creationParamMethod.GetParameters();

                if (requiredParameters.Length == 0 && property.PropertyType == typeof(bool))
                {
                    if (property.GetValue(creationParams) is bool boolParam && boolParam)
                    {
                        creationParamMethod.Invoke(this, null);
                    }
                    continue;
                }

                var creationParamValue = property.GetValue(creationParams);

                if (creationParamValue == null || (creationParamValue is string value && string.IsNullOrEmpty(value)))
                {
                    continue;
                }

                creationParamMethod.Invoke(this, [creationParamValue]);
            }

            return this;
        }

        [CreationParameter(nameof(OfferSearchParams.Count))]
        public IOffersBuilder WithCount(int count)
        {
            _packagesRequestFaker.RuleFor(x => x.Take, count);

            return this;
        }

        [CreationParameter(nameof(OfferSearchParams.Language))]
        public IOffersBuilder WithLanguage(string language)
        {
            if (string.IsNullOrEmpty(language))
                return this;

            _languageCookie = CookiesHelper.BuildCookieString("holidays#lang", language);
            var marketCode = _marketSettings.Markets.First(x => x.Value.Languages.Contains(language)).Key;
            _packagesRequestFaker
                .RuleFor(x => x.Departure, f => f.PickRandom(OfferConstants.DepartureAirportList[marketCode]));

            return this;
        }

        [CreationParameter(nameof(OfferSearchParams.FlexibleDays))]
        public IOffersBuilder WithFlexDays(int flexibleDays)
        {
            _packagesRequestFaker.RuleFor(x => x.FlexibleDays, flexibleDays);

            return this;
        }

        public async Task<IEnumerable<Offer>> Build()
        {
            var request = _packagesRequestFaker.Generate();
            var packages = await searchApi.GetPackages(request, _languageCookie);

            _httpLogsStorage.Add(packages.MapApiResponseToLogs());

            var offers = packages
                .Content?
                .Offers?
                .Where(x => !x.Accom.Id.ToUpperInvariant().StartsWith('X'))
                .Where(x => !x.Accom.Id.ToUpperInvariant().StartsWith('Z'))
                .ToList()
                ?? [];

            return offers;
        }
    }
}
