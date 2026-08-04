using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    [Route("referenceData")]
    [ApiController]
    [ApiVersion("1.0")]
    public class ReferenceDataController : Controller
    {
        private readonly EnvironmentBehaviourSettings _envBehaviorSettings;
        private readonly IReferenceDataService _referenceDataService;
        private readonly LanguageSettings _languageSettings;

        public ReferenceDataController(
            IReferenceDataService referenceDataService,
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            IOptions<LanguageSettings> languageSettings)
        {
            _envBehaviorSettings = envBehaviorSettings.Value ?? throw new ArgumentNullException(nameof(envBehaviorSettings));
            _languageSettings = languageSettings.Value ?? throw new ArgumentNullException(nameof(languageSettings));
            _referenceDataService = referenceDataService;
        }

        /// <summary>
        /// Refresh reference data cache
        /// </summary>
        /// <returns></returns>
        /// <response code="200">Ok</response>
        /// <response code="503">Internal server error</response>
        //TODO Move to CacheController
        [HttpGet]
        [Route("refresh")]
        [ServiceFilter(typeof(ApiAuthAttribute))]
        public async Task<IActionResult> RefreshAsync()
        {
            if (!_envBehaviorSettings.AllowReferenceDataCacheRefresh)
            {
                return StatusCode((int)HttpStatusCode.Forbidden);
            }

            await _referenceDataService.RefreshCacheData(_languageSettings.AllLanguages);
            return Ok();
        }
    }
}