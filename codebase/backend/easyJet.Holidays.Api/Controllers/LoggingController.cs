using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace easyJet.Holidays.Api.Controllers
{
    [Route("logging")]
    [ApiController]
    [ApiVersion("1.0")]
    public class LoggingController : Controller
    {
        private readonly ILogger<LoggingController> _logger;

        public LoggingController(
            ILogger<LoggingController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Log event
        /// </summary>
        /// <param name="logEvent">Event data: level and message</param>
        /// <returns></returns>
        /// <response code="200">Ok</response>
        /// <response code="503">Internal server error</response>
        [HttpPost]
        [ApiConventionMethod(typeof(DefaultApiConventions), nameof(DefaultApiConventions.Create))]
        public IActionResult Log([FromBody] LogEvent logEvent)
        {
            if (logEvent == null)
                throw new ArgumentNullException(nameof(logEvent));
            if (string.IsNullOrWhiteSpace(logEvent.Message))
                throw new ArgumentException("Expected message in log event");

            var messageBody = LogSanitizer.SanitizeNewLines(logEvent.Message);

            LogEventException jsLogException = null;
            if (!string.IsNullOrWhiteSpace(logEvent.StackTrace))
            {
                jsLogException = new LogEventException(messageBody, logEvent.StackTrace);
            }

            switch (logEvent.Level)
            {
                case "error":
                    _logger.LogError(jsLogException, messageBody);
                    break;
                case "warn":
                    _logger.LogWarning(jsLogException, messageBody);
                    break;
                case "info":
                    _logger.LogInformation(jsLogException, messageBody);
                    break;
                case "debug":
                    _logger.LogDebug(jsLogException, messageBody);
                    break;
                case "trace":
                    _logger.LogTrace(jsLogException, messageBody);
                    break;
                default:
                    _logger.LogError(jsLogException, messageBody);

                    throw new ArgumentException($"Unknown level: '{logEvent.Level}'");
            }

            return Ok();
        }
    }
}