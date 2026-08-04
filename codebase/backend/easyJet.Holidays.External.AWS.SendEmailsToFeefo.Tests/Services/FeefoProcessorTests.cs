using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.Api.Domain.Interfaces.Marketing;
using easyJet.Holidays.External.AWS.SendEmailsToFeefo.Services;
using easyJet.Holidays.External.AWS.SendEmailsToFeefo.Settings;
using easyJet.Holidays.External.Feefo.Interfaces;
using easyJet.Holidays.External.Feefo.Models.EnterSale;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Holidays.External.AWS.SendEmailsToFeefo.Tests.Services;

public class FeefoProcessorTests
{
    private readonly Mock<IFeefoService> _feefoService;
    private readonly Mock<ICsatService> _csatService;
    private readonly Mock<IRandomGenerator> _randomGenerator;
    private readonly Mock<ILogger<FeefoProcessor>> _logger;
    private readonly LambdaSettings _lambdaSettings;

    private readonly FeefoProcessor _sut;

    public FeefoProcessorTests()
    {
        // Setting up the LambdaSettings for the tests
        _lambdaSettings = new LambdaSettings()
        {
            Delay = 10,
            SampleRate = 0.2 // Sample rate for controlling randomness
        };

        _feefoService = new();
        _csatService = new();
        _randomGenerator = new();
        _logger = new();

        _sut = new FeefoProcessor(
            _feefoService.Object,
            _csatService.Object,
            _randomGenerator.Object,
            _logger.Object,
            Options.Create(_lambdaSettings)
        );
    }


    /// <summary>
    /// Tests that when the email consent is given and the random 
    /// condition allows sending, it successfully sends the data to Feefo.
    /// </summary>
    [Fact]
    public async Task SendDataToFeefo_SuccessfulSend_ReturnsEmptyBatchItemFailures()
    {
        // Arrange
        var feefoEnterSale = new FeefoEnterSale { Email = "test@example.com" };
        var sqsEvent = new SQSEvent
        {
            Records = new List<SQSEvent.SQSMessage>
            {
                new SQSEvent.SQSMessage
                {
                    Body = JsonConvert.SerializeObject(feefoEnterSale),
                    MessageId = "1"
                }
            }
        };

        // Mocking random generator to return a value that allows sending
        _randomGenerator.Setup(gen => gen.NextDouble()).Returns(0.1);
        _csatService.Setup(service => service.CheckMarketingEmailConsent(feefoEnterSale.Email)).ReturnsAsync(true);
        _feefoService.Setup(service => service.SendData(It.IsAny<FeefoEnterSale>())).ReturnsAsync(true);

        // Act
        var result = await _sut.Process(sqsEvent.Records);

        // Assert
        _feefoService.Verify(service => service.SendData(It.IsAny<FeefoEnterSale>()), Times.Once);
        Assert.Empty(result.BatchItemFailures);
    }

    /// <summary>
    /// Tests that when the random condition prevents sending, 
    /// the function does not send the data to Feefo.
    /// </summary>
    [Fact]
    public async Task SendDataToFeefo_SkipsMessageDueToSampleRate()
    {
        // Arrange
        var feefoEnterSale = new FeefoEnterSale { Email = "test@example.com" };
        var sqsEvent = new SQSEvent
        {
            Records = new List<SQSEvent.SQSMessage>
            {
                new SQSEvent.SQSMessage
                {
                    Body = JsonConvert.SerializeObject(feefoEnterSale),
                    MessageId = "1"
                }
            }
        };

        // Mocking random generator to return a value that skips sending
        _randomGenerator.Setup(gen => gen.NextDouble()).Returns(0.3);
        _csatService.Setup(service => service.CheckMarketingEmailConsent(feefoEnterSale.Email)).ReturnsAsync(true);

        // Act
        var result = await _sut.Process(sqsEvent.Records);

        // Assert
        _feefoService.Verify(service => service.SendData(It.IsAny<FeefoEnterSale>()), Times.Never);
        Assert.Empty(result.BatchItemFailures);
    }

    /// <summary>
    /// Tests that if email consent is not given, the message is not sent,
    /// regardless of the random condition.
    /// </summary>
    [Fact]
    public async Task SendDataToFeefo_WithoutEmailConsent_DoesNotSendData()
    {
        // Arrange
        var feefoEnterSale = new FeefoEnterSale { Email = "test@example.com" };
        var sqsEvent = new SQSEvent
        {
            Records = new List<SQSEvent.SQSMessage>
            {
                new SQSEvent.SQSMessage
                {
                    Body = JsonConvert.SerializeObject(feefoEnterSale),
                    MessageId = "1"
                }
            }
        };

        // Mocking email consent to return false
        _csatService.Setup(service => service.CheckMarketingEmailConsent(feefoEnterSale.Email)).ReturnsAsync(false);

        // Act
        var result = await _sut.Process(sqsEvent.Records);

        // Assert
        _feefoService.Verify(service => service.SendData(It.IsAny<FeefoEnterSale>()), Times.Never);
        Assert.Empty(result.BatchItemFailures);
    }

    /// <summary>
    /// Tests that when sending data to Feefo fails, the failed message 
    /// is recorded in BatchItemFailures.
    /// </summary>
    [Fact]
    public async Task SendDataToFeefo_FailedSend_ReturnsBatchItemFailures()
    {
        // Arrange
        var feefoEnterSale = new FeefoEnterSale { Email = "test@example.com" };
        var sqsEvent = new SQSEvent
        {
            Records = new List<SQSEvent.SQSMessage>
            {
                new SQSEvent.SQSMessage
                {
                    Body = JsonConvert.SerializeObject(feefoEnterSale),
                    MessageId = "1"
                }
            }
        };

        // Setting up the random generator and email consent
        _randomGenerator.Setup(gen => gen.NextDouble()).Returns(0.1);
        _csatService.Setup(service => service.CheckMarketingEmailConsent(feefoEnterSale.Email)).ReturnsAsync(true);
        _feefoService.Setup(service => service.SendData(It.IsAny<FeefoEnterSale>())).ReturnsAsync(false);

        // Act
        var result = await _sut.Process(sqsEvent.Records);

        // Assert
        _feefoService.Verify(service => service.SendData(It.IsAny<FeefoEnterSale>()), Times.Once);
        Assert.NotEmpty(result.BatchItemFailures);
        Assert.Equal("1", result.BatchItemFailures.First().ItemIdentifier);
    }
}