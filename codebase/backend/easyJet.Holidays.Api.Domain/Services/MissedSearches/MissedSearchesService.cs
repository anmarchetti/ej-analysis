using easyJet.Holidays.Api.Domain.Data.DynamoDB.SearchPodValidation;
using easyJet.Holidays.Api.Domain.Interfaces.MissedSearches;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using System.Text;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Services.MissedSearches
{
    public partial class MissedSearchesService : IMissedSearchesService
    {
        private readonly ILanguageService _languageService;
        private readonly IMarketService _marketService;
        private readonly IAWSDbRepository<MissedDestinationSearch> _repository;

        private const char MASK_CHAR = '*';

        [GeneratedRegex(@"\p{L}+")]
        private static partial Regex WhitelistRegex();

        public MissedSearchesService(
            ILanguageService languageService,
            IMarketService marketService,
            IAWSDbRepository<MissedDestinationSearch> repository)
        {
            _languageService = languageService;
            _marketService = marketService;
            _repository = repository;
        }

        /// <inheritdoc/>
        public async Task Save(string query, string from, int flexibleDays, DateTime? startDate, DateTime? endDate)
        {
            await _repository.SaveAsync(new MissedDestinationSearch
            {
                Id = Guid.NewGuid().ToString(),
                Query = RedactSensitiveDataFromQuery(query),
                From = from,
                SearchDate = DateTime.UtcNow,
                FlexibleDays = flexibleDays,
                StartDate = startDate,
                EndDate = endDate,
                Market = _marketService.GetCurrentMarket().Code,
                Language = _languageService.GetCurrentLanguage()
            });
        }

        /// <summary>
        /// Redacts sensitive data from query using whitelist regex
        /// </summary>
        /// <param name="query"></param>
        /// <returns></returns>
        public static string RedactSensitiveDataFromQuery(string query)
        {
            var match = WhitelistRegex().Match(query);

            if (!match.Success)
                return new string(MASK_CHAR, query.Length);

            var builder = new StringBuilder(query.Length, query.Length);
            var position = 0;
            do
            {
                builder.Append(MASK_CHAR, match.Index - position);
                builder.Append(match.Value);
                position = match.Index + match.Length;
                match = match.NextMatch();
            }
            while (match.Success);

            if (position < query.Length)
                builder.Append(MASK_CHAR, query.Length - position);

            return builder.ToString();
        }
    }
}
