using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.HelpCenter;
using easyJet.Holidays.Api.Domain.Data.HelpCenter;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.HelpCenter;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.HelpCenter
{
    public class FeedbackServiceTests
    {
        private readonly IFixture _fixture;

        public FeedbackServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            // triggering the Freeze call to override IOptions mock, so the sut gets constructed with non-null values by default
            _fixture.Freeze<Mock<IOptions<ApiSettings>>>().Setup(x => x.Value)
                .Returns(new ApiSettings
                {
                    BookingFeedback = new()
                    {
                        BusinessTags = new()
                    }
                });
        }

        [Fact]
        public async Task Save_InputModelValid_CallRepositorySaveAsyncMethod()
        {
            // Arrange
            var awsRepository = _fixture.Freeze<Mock<IAWSDbRepository<FeedbackInfo>>>();
            var sut = _fixture.Create<FeedbackService>();

            // Act
            await sut.Save(new FeedbackInfoRequest
            {
                Question = "Test_Q",
                Comment = "Test_comment",
                Icon = 1
            });

            // Assert
            awsRepository.Verify(x => x.SaveAsync(It.IsAny<FeedbackInfo>()), Times.Once);
        }

        [Fact]
        public async Task Save_AWSRepoThrowException_ThrowExceptionWithSpecialMessage()
        {
            // Arrange
            var awsRepository = _fixture.Freeze<Mock<IAWSDbRepository<FeedbackInfo>>>();

            var errorMessage = "Cannot save item in DB";

            awsRepository.Setup(x => x.SaveAsync(It.IsAny<FeedbackInfo>())).Throws(new Exception(errorMessage));

            var sut = _fixture.Create<FeedbackService>();

            // Act
            var result = await Assert.ThrowsAsync<ApiException>(() => sut.Save(new FeedbackInfoRequest
            {
                Question = "Test_Q",
                Comment = "Test_comment",
                Icon = 1
            }));

            // Assert
            result.Message.Should().BeEquivalentTo("Cannot save item in DB");
        }
    }
}
