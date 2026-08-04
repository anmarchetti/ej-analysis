using System;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Logger;
using log4net;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Logger
{
    public class BaseLoggerTests
    {
        private readonly ILog log;
        private readonly BaseLogger logger;

        public BaseLoggerTests()
        {
            log = Substitute.For<ILog>();
            logger = Substitute.ForPartsOf<BaseLogger>(log);
        }

        [Theory]
        [AutoData]
        public void Debug_ShouldLogDebugMessageWithType_IfExecuteDebugWithOwner(string message)
        {
            logger.Debug(message, this);

            log.Received().Debug(Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Debug_ShouldLogDebugMessageAndException_IfExecuteDebugWithException(string message, Exception ex)
        {
            logger.Debug(message, ex, this);

            log.Received().Debug(Arg.Any<object>(), Arg.Any<Exception>());
        }

        [Theory]
        [AutoData]
        public void Info_ShouldLogInfoMessage_IfExecuteInfoWithOwner(string message)
        {
            logger.Info(message, this);

            log.Received().Info(Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Info_ShouldLogInfoMessageAndException_IfExecuteInfoWithException(string message, Exception ex)
        {
            logger.Info(message, ex, this);

            log.Received().Info(Arg.Any<object>(), Arg.Any<Exception>());
        }

        [Theory]
        [AutoData]
        public void Error_ShouldLogErrorMessage_IfExecuteErrorWithOwner(string message)
        {
            logger.Error(message, this);

            log.Received().Error(Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Error_ShouldLogErrorMessageAndException_IfExecuteErrorWithException(string message, Exception ex)
        {
            logger.Error(message, ex, this);

            log.Received().Error(Arg.Any<object>(), Arg.Any<Exception>());
        }

        [Theory]
        [AutoData]
        public void Fatal_ShouldLogFatalMessage_IfExecuteFatalWithOwner(string message)
        {
            logger.Fatal(message, this);

            log.Received().Fatal(Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Fatal_ShouldLogFatalMessageAndException_IfExecuteFatalWithException(string message, Exception ex)
        {
            logger.Fatal(message, ex, this);

            log.Received().Fatal(Arg.Any<object>(), Arg.Any<Exception>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldLogWarnMessage_IfExecuteWarnWithOwner(string message)
        {
            logger.Warn(message, this);

            log.Received().Warn(Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldLogWarnMessageAndException_IfExecuteWarnWithException(string message, Exception ex)
        {
            logger.Warn(message, ex, this);

            log.Received().Warn(Arg.Any<object>(), Arg.Any<Exception>());
        }
    }
}
