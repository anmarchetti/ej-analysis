using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.HelpCenter;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.HelpCenter;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.HelpCenter
{
    public class FaqServiceTests
    {
        private readonly IFixture _fixture;

        public FaqServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
        }

        [Fact]
        public async Task Save_InputModelValid_CallRepositorySaveAsyncMethod()
        {
            // Arrange
            var awsRepository = _fixture.Freeze<Mock<IAWSDbRepository<FaqInfo>>>();
            var sut = _fixture.Create<FaqService>();

            // Act
            await sut.Save(new FaqInfo
            {
                Question = "Test_Q",
                QuestionHeader = "Test_QH",
                QuestionId = "Test_QId",
                Text = "Test_Text",
                WasUseful = true,
                Date = DateTime.Now
            });

            // Assert
            awsRepository.Verify(x => x.SaveAsync(It.IsAny<FaqInfo>()), Times.Once);
        }

        [Fact]
        public async Task Save_AWSRepoThrowException_ThrowExceptionWithSpecialMessage()
        {
            // Arrange
            var awsRepository = _fixture.Freeze<Mock<IAWSDbRepository<FaqInfo>>>();

            var errorMessage = "Cannot save item in DB";

            awsRepository.Setup(x => x.SaveAsync(It.IsAny<FaqInfo>())).Throws(new Exception(errorMessage));

            var sut = _fixture.Create<FaqService>();

            // Act
            var result = await Assert.ThrowsAsync<ApiException>(() => sut.Save(new FaqInfo
            {
                Question = "Test_Q",
                QuestionHeader = "Test_QH",
                QuestionId = "Test_QId",
                Text = "Test_Text",
                WasUseful = true,
                Date = DateTime.Now
            }));

            // Assert
            result.Message.Should().BeEquivalentTo("Cannot save item in DB");
        }
    }
}
