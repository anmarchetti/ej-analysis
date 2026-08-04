using Microsoft.Extensions.Logging;
using Moq;
using System.Linq.Expressions;

namespace easyJet.Holidays.Tests.Domain
{
    public class LoggerTestUtils
    {
        public static Expression<Action<ILogger<T>>> VerifyForLogLevel<T>(LogLevel levelToVerify)
        {
            return loggerMock =>
                loggerMock.Log(
                    It.Is<LogLevel>(logLevel => logLevel == levelToVerify),
                    It.Is<EventId>(eventId => eventId.Id == 0),
                    It.Is<It.IsAnyType>((@object, @type) => true),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()
                );
        }
    }
}
