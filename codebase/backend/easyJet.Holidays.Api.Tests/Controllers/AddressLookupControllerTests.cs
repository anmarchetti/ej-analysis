using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.External.Data8.Ancillaries;
using easyJet.Holidays.External.Data8.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers;

public class AddressLookupControllerTests
{
    [Fact]
    public async Task Get_ReturnsOkWithAddressesFromService()
    {
        const string countryCode = "GB";
        using var cancellationTokenSource = new CancellationTokenSource();
        var cancellationToken = cancellationTokenSource.Token;
        var serviceResponse = new SearchAddressResponse
        {
            Items = new([new SearchAddressItem { AddressLine = "2 King Road" }])
        };

        var serviceMock = new Mock<IAddressLookupService>();
        serviceMock
            .Setup(x => x.LookupAddress("2 king road", countryCode, cancellationToken))
            .ReturnsAsync(serviceResponse);

        var sut = new AddressLookupController(serviceMock.Object);

        var response = await sut.Get("2 king road", countryCode, cancellationToken);

        response.Should().BeOfType<OkObjectResult>();
        response.As<OkObjectResult>().Value.Should().BeSameAs(serviceResponse);
        serviceMock.Verify(x => x.LookupAddress("2 king road", countryCode, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task Retrieve_ReturnsOkWithAddressFromService()
    {
        const string countryCode = "GB";
        using var cancellationTokenSource = new CancellationTokenSource();
        var cancellationToken = cancellationTokenSource.Token;
        var serviceResponse = new AddressResult { AddressLine1 = "2 King Road" };

        var serviceMock = new Mock<IAddressLookupService>();
        serviceMock
            .Setup(x => x.RetrieveAddress("id-1", countryCode, cancellationToken))
            .ReturnsAsync(serviceResponse);

        var sut = new AddressLookupController(serviceMock.Object);

        var response = await sut.Retrieve("id-1", countryCode, cancellationToken);

        response.Should().BeOfType<OkObjectResult>();
        response.As<OkObjectResult>().Value.Should().BeSameAs(serviceResponse);
        serviceMock.Verify(x => x.RetrieveAddress("id-1", countryCode, cancellationToken), Times.Once);
    }
}
