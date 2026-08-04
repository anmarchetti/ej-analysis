using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Models;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Services;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Settings;
using FluentAssertions;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.External.AWS.HBGHotelDiscountsSync.Tests.Services;

public class HbgHotelDiscountsServiceTests
{
    private static HbgHotelDiscountsService CreateService(
    IEnumerable<HbgHotelDiscountOffer> offers,
    LambdaSettings settings,
    Func<IReadOnlyCollection<HbgHotelDiscount>, string, CancellationToken, Task<int>> writeHandler,
    Mock<ILogger<HbgHotelDiscountsService>>? loggerMock = null,
    Mock<IHttpClientWrapper>? sourceClientMock = null,
    Mock<IHbgHotelDiscountsRepository>? repoMock = null,
    bool configureRepository = true)
    {
        sourceClientMock ??= new Mock<IHttpClientWrapper>();
        sourceClientMock.Setup(x => x.GetOffers(It.IsAny<string>(), It.IsAny<CancellationToken>()))
        .ReturnsAsync(offers.ToList());

        repoMock ??= new Mock<IHbgHotelDiscountsRepository>();
        if (configureRepository)
        {
            repoMock.Setup(r => r.ClearOffers(settings.DynamoDbTableName, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
            repoMock.Setup(r => r.WriteOffers(It.IsAny<IReadOnlyCollection<HbgHotelDiscount>>(), settings.DynamoDbTableName, It.IsAny<CancellationToken>()))
            .Returns<IReadOnlyCollection<HbgHotelDiscount>, string, CancellationToken>((o, _, ct) => writeHandler(o, settings.DynamoDbTableName, ct));
        }

        loggerMock ??= new Mock<ILogger<HbgHotelDiscountsService>>();
        return new HbgHotelDiscountsService(sourceClientMock.Object, repoMock.Object, Options.Create(settings), loggerMock.Object);
    }

    private static HbgHotelDiscountOffer CreateOffer(int discount, string? accomCode = null) => new()
    {
        AccommodationCode = accomCode ?? $"ACC{discount}",
        DiscountPercentage = discount,
        GiataCode = 1000 + discount,
        AccommodationName = $"Hotel {discount}",
        TravelWindowFrom = "2024-01-01",
        TravelWindowTo = "2024-12-31"
    };

    // Constructor guard clause tests
    [Fact]
    public void Constructor_Throws_ForNullSourceClient() =>
    Assert.Throws<ArgumentNullException>(() => new HbgHotelDiscountsService(null!, Mock.Of<IHbgHotelDiscountsRepository>(), Options.Create(new LambdaSettings()), Mock.Of<ILogger<HbgHotelDiscountsService>>()));

    [Fact]
    public void Constructor_Throws_ForNullRepository() =>
    Assert.Throws<ArgumentNullException>(() => new HbgHotelDiscountsService(Mock.Of<IHttpClientWrapper>(), null!, Options.Create(new LambdaSettings()), Mock.Of<ILogger<HbgHotelDiscountsService>>()));

    [Fact]
    public void Constructor_Throws_ForNullOptions() =>
    Assert.Throws<ArgumentNullException>(() => new HbgHotelDiscountsService(Mock.Of<IHttpClientWrapper>(), Mock.Of<IHbgHotelDiscountsRepository>(), null!, Mock.Of<ILogger<HbgHotelDiscountsService>>()));

    [Fact]
    public void Constructor_Throws_ForNullLogger() =>
    Assert.Throws<ArgumentNullException>(() => new HbgHotelDiscountsService(Mock.Of<IHttpClientWrapper>(), Mock.Of<IHbgHotelDiscountsRepository>(), Options.Create(new LambdaSettings()), null!));

    [Fact]
    public async Task Sync_ReturnsZero_WhenNoOffersFetched()
    {
        var settings = new LambdaSettings { MinimumDiscountThreshold = 10, DynamoDbTableName = "tbl", SourceEndpoint = "http://endpoint" };
        var repoMock = new Mock<IHbgHotelDiscountsRepository>();
        var service = CreateService(Array.Empty<HbgHotelDiscountOffer>(), settings, (o, _, __) => Task.FromResult(0), repoMock: repoMock);
        var result = await service.Sync();
        result.Should().Be(0);
        repoMock.Verify(r => r.ClearOffers(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Sync_ReturnsZero_WhenOffersBelowThreshold()
    {
        var offers = new[] { CreateOffer(1), CreateOffer(5) };
        var settings = new LambdaSettings { MinimumDiscountThreshold = 10, DynamoDbTableName = "tbl" };
        var repoMock = new Mock<IHbgHotelDiscountsRepository>();
        var service = CreateService(offers, settings, (o, _, __) => Task.FromResult(o.Count), repoMock: repoMock);
        var result = await service.Sync();
        result.Should().Be(0);
        repoMock.Verify(r => r.ClearOffers(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Sync_FiltersAndPersistsAboveThreshold()
    {
        var offers = new[] { CreateOffer(5), CreateOffer(15), CreateOffer(20) };
        var settings = new LambdaSettings { MinimumDiscountThreshold = 10, DynamoDbTableName = "tbl" };
        var capturedCount = 0;
        var repoMock = new Mock<IHbgHotelDiscountsRepository>();
        var service = CreateService(offers, settings, (o, _, __) => { capturedCount = o.Count; return Task.FromResult(o.Count); }, repoMock: repoMock);
        var result = await service.Sync();
        result.Should().Be(2);
        capturedCount.Should().Be(2);
        repoMock.Verify(r => r.ClearOffers(settings.DynamoDbTableName, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Sync_ClearsTableBeforeWriting()
    {
        var offers = new[] { CreateOffer(10, "ACC1") };
        var settings = new LambdaSettings { MinimumDiscountThreshold = 0, DynamoDbTableName = "tbl" };
        var repoMock = new Mock<IHbgHotelDiscountsRepository>();
        var sequence = new MockSequence();
        repoMock.InSequence(sequence)
            .Setup(r => r.ClearOffers(settings.DynamoDbTableName, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repoMock.InSequence(sequence)
            .Setup(r => r.WriteOffers(It.IsAny<IReadOnlyCollection<HbgHotelDiscount>>(), settings.DynamoDbTableName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var service = CreateService(offers, settings, (_, _, __) => Task.FromResult(1), repoMock: repoMock, configureRepository: false);

        var result = await service.Sync();

        result.Should().Be(1);
        repoMock.VerifyAll();
    }

    [Fact]
    public async Task Sync_GroupsOffersByAccommodationCode()
    {
        var offers = new[] { CreateOffer(10, "ACC1"), CreateOffer(15, "ACC1"), CreateOffer(20, "ACC2") };
        var settings = new LambdaSettings { MinimumDiscountThreshold = 0, DynamoDbTableName = "tbl" };
        IReadOnlyCollection<HbgHotelDiscount>? captured = null;
        var service = CreateService(offers, settings, (o, _, __) =>
        {
            captured = o;
            return Task.FromResult(o.Count);
        });

        var result = await service.Sync();

        result.Should().Be(2);
        captured.Should().NotBeNull();
        captured!.Single(o => o.AccommodationCode == "ACC1").Discounts.Should().HaveCount(2);
    }

    [Fact]
    public async Task Sync_MultiBatch_NoFiltering()
    {
        var offers = Enumerable.Range(1, 51).Select(i => CreateOffer(i)).ToList();
        var settings = new LambdaSettings { MinimumDiscountThreshold = 0, DynamoDbTableName = "tbl" };
        var service = CreateService(offers, settings, (o, _, __) => Task.FromResult(o.Count));
        var result = await service.Sync();
        result.Should().Be(51);
    }

    [Fact]
    public async Task Sync_RepositoryReturnsLessThanOffers()
    {
        var offers = Enumerable.Range(1, 10).Select(i => CreateOffer(i)).ToList();
        var settings = new LambdaSettings { MinimumDiscountThreshold = 0, DynamoDbTableName = "tbl" };
        var service = CreateService(offers, settings, (o, _, __) => Task.FromResult(7));
        var written = await service.Sync();
        written.Should().Be(7);
    }

    [Fact]
    public async Task Sync_RepositoryThrows()
    {
        var offers = Enumerable.Range(1, 5).Select(i => CreateOffer(i)).ToList();
        var settings = new LambdaSettings { MinimumDiscountThreshold = 0, DynamoDbTableName = "tbl" };
        var service = CreateService(offers, settings, (_, _, __) => Task.FromException<int>(new InvalidOperationException()));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.Sync());
    }

    [Fact]
    public async Task Sync_CancellationTokenPassedThrough()
    {
        var offers = Enumerable.Range(1, 3).Select(i => CreateOffer(i)).ToList();
        var settings = new LambdaSettings { MinimumDiscountThreshold = 0, DynamoDbTableName = "tbl" };
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        var capturedTokenCancelled = false;
        var service = CreateService(offers, settings, (o, _, token) => { capturedTokenCancelled = token.IsCancellationRequested; return Task.FromResult(o.Count); });
        var result = await service.Sync(cts.Token);
        result.Should().Be(3);
        capturedTokenCancelled.Should().BeTrue();
    }
}
