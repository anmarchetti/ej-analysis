using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.FreeNights;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Interfaces;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Services;
using FluentAssertions;
using Moq;
using Xunit;
using FreeNight = easyJet.Holidays.External.AWS.FreeNightsDataSync.Models.FreeNight;

namespace easyJet.Holidays.External.AWS.FreeNightsDataSync.Tests.Services;

public class FreeNightsSyncServiceTests
{
    private readonly Mock<IFreeNightsService> _freeNightsService;
    private readonly Mock<IFreeNightsRepository> _freeNightsRepository;

    private readonly FreeNightsSyncService _sut;

    public FreeNightsSyncServiceTests()
    {
        _freeNightsService = new();
        _freeNightsRepository = new();

        _sut = new(_freeNightsService.Object, _freeNightsRepository.Object);
    }

    [Theory]
    [AutoData]
    public async Task Sync_EachRequiredStepProceedOnce(string eskelDataUri, List<FreeNight> freeNights)
    {
        //Arrange
        _freeNightsService.Setup(service => service.DeleteAll()).Returns(Task.CompletedTask);

        _freeNightsRepository.Setup(repository => repository.GetAll()).ReturnsAsync(freeNights.ToArray);

        _freeNightsService.Setup(service => service.Put(It.IsAny<IEnumerable<AccomFreeNights>>())).Returns(Task.CompletedTask);

        //Act
        await _sut.Sync();

        //Assert
        _freeNightsService.Verify(service => service.DeleteAll(), Times.Once);
        _freeNightsRepository.Verify(repository => repository.GetAll(), Times.Once);
        _freeNightsService.Verify(service => service.Put(It.IsAny<IEnumerable<AccomFreeNights>>()), Times.Once);
    }

    [Theory]
    [AutoData]
    public async Task Sync_EmptyDataFromDynamoDb_ThrowError(string eskelDataUri)
    {
        //Arrange
        _freeNightsService.Setup(service => service.DeleteAll()).Returns(Task.CompletedTask);

        _freeNightsRepository.Setup(repository => repository.GetAll()).ReturnsAsync(default(FreeNight[]));

        _freeNightsService.Setup(service => service.Put(It.IsAny<IEnumerable<AccomFreeNights>>())).Returns(Task.CompletedTask);

        // Act
        var action = async () => await _sut.Sync();

        //Assert
        await action.Should().ThrowAsync<Exception>();
    }

    [Theory]
    [AutoData]
    public async Task Sync_ErrorDuringDeleteAllItemsFromDynamoDb_ThrowError(string eskelDataUri, string errorMessage)
    {
        // Arrange
        _freeNightsService.Setup(service => service.DeleteAll()).Throws(new Exception());

        _freeNightsRepository.Setup(repository => repository.GetAll()).ReturnsAsync(default(FreeNight[]));

        _freeNightsService.Setup(service => service.Put(It.IsAny<IEnumerable<AccomFreeNights>>())).Returns(Task.CompletedTask);

        // Act
        var action = async () => await _sut.Sync();

        //Assert
        await action.Should().ThrowAsync<Exception>();
    }
}