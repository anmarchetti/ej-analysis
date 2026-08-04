using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers.TradePortal
{
    [Route("trade-portal/account")]
    [ApiController]
    [ApiVersion("1.0")]
    public class TradePortalAccountController : ControllerBase
    {
        private readonly ITradeAgentAuthenticationService _agentAuthenticationService;
        private readonly ITradeAgentCookieAuthService _tradeAgentCookieAuthService;

        public TradePortalAccountController(ITradeAgentAuthenticationService agentAuthenticationService,
            ITradeAgentCookieAuthService tradeAgentCookieAuthService)
        {
            _agentAuthenticationService = agentAuthenticationService;
            _tradeAgentCookieAuthService = tradeAgentCookieAuthService;
        }

        /// <summary>
        /// Customer login
        /// </summary>
        /// <param name="request">Login data: username, password, rememberMe</param>
        /// <response code="200">Success</response>
        /// <response code="401">Invalid email/password</response>
        [HttpPost]
        [Route("login")]
        [ProducesResponseType(typeof(AgentDetails), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Login([FromBody] AgentCredentials request)
        {
            try
            {
                var agent = await _tradeAgentCookieAuthService.Login(request);
                return Ok(agent);
            }
            catch (ApiException ex)
            {
                if (ex.StatusCode == HttpStatusCode.Forbidden)
                {
                    throw;
                }

                throw new ApiException(ex, HttpStatusCode.BadRequest);
            }
        }

        /// <summary>
        /// Customer logout
        /// </summary>
        /// <response code="200">Success</response>
        /// <response code="503">Unexpected error</response>
        [HttpPost]
        [Route("logout")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public IActionResult Logout()
        {
            _tradeAgentCookieAuthService.Logout();

            return Ok();
        }

        /// <summary>
        /// Get user login status.
        /// </summary>
        /// <response code="200">Return user login status</response>
        /// <response code="503">Unexpected error</response>
        [HttpGet]
        [Route("status")]
        public IActionResult Status()
        {
            var signedIn = _agentAuthenticationService.GetCurrentAgent();

            return Ok(new
            {
                signedIn,
            });
        }

        // TODO Agent details to show name
    }
}