using Xunit;
using Moq;
using FluentAssertions;
using easyJet.Holidays.External.Data8.Ancillaries;
using easyJet.Holidays.External.Data8.Models;

namespace easyJet.Holidays.External.Data8.Tests;

public class AddressLookupServiceTests
{
    [Fact]
    public async Task LookupAddress_ForwardsRequestToAdapter()
    {
        const string countryCode = "GB";
        var cancellationToken = new CancellationTokenSource().Token;
        var expected = new SearchAddressResponse
        {
            Items = new([new SearchAddressItem { AddressLine = "2 King Road" }])
        };

        var adapterMock = new Mock<IData8Adapter>();
        adapterMock
            .Setup(x => x.LookupAddress("2 king road", countryCode, cancellationToken))
            .ReturnsAsync(expected);

        var sut = new AddressLookupService(adapterMock.Object);

        var result = await sut.LookupAddress("2 king road", countryCode, cancellationToken);

        result.Should().BeSameAs(expected);
        adapterMock.Verify(x => x.LookupAddress("2 king road", countryCode, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task RetrieveAddress_ForwardsRequestToAdapter()
    {
        const string countryCode = "GB";
        var cancellationToken = new CancellationTokenSource().Token;
        var expected = new AddressResult { AddressLine1 = "2 King Road" };

        var adapterMock = new Mock<IData8Adapter>();
        adapterMock
            .Setup(x => x.RetrieveAddress("id-1", countryCode, cancellationToken))
            .ReturnsAsync(expected);

        var sut = new AddressLookupService(adapterMock.Object);

        var result = await sut.RetrieveAddress("id-1", countryCode, cancellationToken);

        result.Should().BeSameAs(expected);
        adapterMock.Verify(x => x.RetrieveAddress("id-1", countryCode, cancellationToken), Times.Once);
    }
}
