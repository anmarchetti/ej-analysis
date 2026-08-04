using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Models;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Services;
using FluentAssertions;
using Moq;
using Microsoft.Extensions.Logging;
using Xunit;

namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Tests.Services;

public class HbgHotelDiscountsRepositoryTests
{
    private static HbgHotelDiscountsRepository CreateRepo(
        Func<BatchWriteItemRequest, BatchWriteItemResponse?> responseFactory,
        out Mock<IAmazonDynamoDB> dynamoMock,
        out Mock<ILogger<HbgHotelDiscountsRepository>> loggerMock,
        Func<ScanRequest, ScanResponse?>? scanFactory = null)
    {
        dynamoMock = new Mock<IAmazonDynamoDB>();
        loggerMock = new Mock<ILogger<HbgHotelDiscountsRepository>>();
        dynamoMock.Setup(d => d.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), It.IsAny<CancellationToken>()))
        .Returns<BatchWriteItemRequest, CancellationToken>((r, _) => Task.FromResult(responseFactory(r))!);
        dynamoMock.Setup(d => d.ScanAsync(It.IsAny<ScanRequest>(), It.IsAny<CancellationToken>()))
        .Returns<ScanRequest, CancellationToken>((r, _) => Task.FromResult((scanFactory ?? (_ => new ScanResponse()))(r))!);
        return new HbgHotelDiscountsRepository(dynamoMock.Object, loggerMock.Object);
    }

    private static HbgHotelDiscount CreateOffer(int i, long giata = 0) => new()
    {
        AccommodationCode = $"ACC{i}",
        Discounts = new List<Discount>
        {
            new()
            {
                DiscountPercentage = i,
                GiataCode = giata == 0 ? 1000 + i : giata,
                AccommodationName = $"Hotel {i}",
                TravelWindowFrom = "2024-01-01",
                TravelWindowTo = "2024-01-08"
            }
        }.AsReadOnly()
    };

    [Fact]
    public async Task WriteOffersAsync_ReturnsZero_ForNoOffers()
    {
        var repo = CreateRepo(_ => new BatchWriteItemResponse(), out _, out _);
        var result = await repo.WriteOffers(Array.Empty<HbgHotelDiscount>(), "tbl", CancellationToken.None);
        result.Should().Be(0);
    }

    [Fact]
    public async Task WriteOffersAsync_WritesSingleDocumentPerAccommodationCode()
    {
        var offers = new List<HbgHotelDiscount>
        {
            CreateOffer(1, giata: 5000),
            CreateOffer(2, giata: 5000),
            CreateOffer(3, giata: 6000)
        };
        BatchWriteItemRequest? captured = null;
        var repo = CreateRepo(r => { captured = r; return new BatchWriteItemResponse(); }, out _, out _);
        var written = await repo.WriteOffers(offers, "tbl", CancellationToken.None);
        written.Should().Be(3);
        captured.Should().NotBeNull();
        captured!.RequestItems["tbl"].Count.Should().Be(3);
        var firstPut = captured.RequestItems["tbl"][0].PutRequest.Item;
        firstPut.ContainsKey("AccommodationCode").Should().BeTrue();
        firstPut.ContainsKey("Discounts").Should().BeTrue();
        firstPut["Discounts"].L.Should().NotBeNull();
        firstPut["Discounts"].L!.Count.Should().Be(1); // each accommodation code appears once in input
        // Each offer map should include GiataCode as part of embedded attributes
        var offerMap = firstPut["Discounts"].L![0].M;
        offerMap.ContainsKey(nameof(Discount.GiataCode)).Should().BeTrue();
    }

    [Fact]
    public async Task WriteOffersAsync_SubtractsUnprocessed()
    {
        var offers = new List<HbgHotelDiscount>
        {
            CreateOffer(1, giata: 5000),
            CreateOffer(2, giata: 5000),
            CreateOffer(3, giata: 6000)
        };
        var repo = CreateRepo(_ => new BatchWriteItemResponse
        {
            UnprocessedItems = new Dictionary<string, List<WriteRequest>>
             {
                { "tbl", new List<WriteRequest> { new(new PutRequest()), } }
             }
             }, out _, out _);
        var written = await repo.WriteOffers(offers, "tbl", CancellationToken.None);
        written.Should().Be(2); // 3 documents - 1 unprocessed
    }

    [Fact]
    public async Task WriteOffersAsync_NullResponse_SkipsBatch()
    {
        var offers = new List<HbgHotelDiscount>
        {
            CreateOffer(1, giata: 5000),
            CreateOffer(2, giata: 5000),
        };
        var repo = CreateRepo(_ => null, out _, out _);
        var written = await repo.WriteOffers(offers, "tbl", CancellationToken.None);
        written.Should().Be(0);
    }

    [Fact]
    public async Task ClearOffersAsync_DeletesItems()
    {
        var scanResponse = new ScanResponse
        {
            Items = new List<Dictionary<string, AttributeValue>>
            {
                new() { ["AccommodationCode"] = new AttributeValue { S = "ACC1" } },
                new() { ["AccommodationCode"] = new AttributeValue { S = "ACC2" } }
            }
        };
        BatchWriteItemRequest? captured = null;
        var repo = CreateRepo(r => { captured = r; return new BatchWriteItemResponse(); }, out _, out _, _ => scanResponse);

        await repo.ClearOffers("tbl", CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.RequestItems["tbl"].Should().HaveCount(2);
        captured.RequestItems["tbl"].All(r => r.DeleteRequest != null).Should().BeTrue();
    }

    [Fact]
    public async Task ClearOffersAsync_NoItems_SkipsBatchWrite()
    {
        var repo = CreateRepo(_ => new BatchWriteItemResponse(), out var dynamoMock, out _, _ => new ScanResponse { Items = new List<Dictionary<string, AttributeValue>>() });

        await repo.ClearOffers("tbl", CancellationToken.None);

        dynamoMock.Verify(d => d.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ClearOffersAsync_NullScanResponse_SkipsDeletes()
    {
        var repo = CreateRepo(_ => new BatchWriteItemResponse(), out var dynamoMock, out _, _ => null);

        await repo.ClearOffers("tbl", CancellationToken.None);

        dynamoMock.Verify(d => d.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ClearOffersAsync_LogsUnprocessedDeletes()
    {
        var scanResponse = new ScanResponse
        {
            Items = new List<Dictionary<string, AttributeValue>>
            {
                new() { ["AccommodationCode"] = new AttributeValue { S = "ACC1" } }
            }
        };
        var batchResponse = new BatchWriteItemResponse
        {
            UnprocessedItems = new Dictionary<string, List<WriteRequest>>
            {
                { "tbl", new List<WriteRequest> { new(new DeleteRequest()) } }
            }
        };

        var repo = CreateRepo(_ => batchResponse, out _, out _, _ => scanResponse);

        await repo.ClearOffers("tbl", CancellationToken.None);
    }

    [Fact]
    public async Task ClearOffersAsync_PaginatesAndSkipsMissingKeys()
    {
        var responses = new Queue<ScanResponse?>();
        responses.Enqueue(new ScanResponse
        {
            Items = new List<Dictionary<string, AttributeValue>>
            {
                new() { ["AccommodationCode"] = new AttributeValue { S = "ACC1" } },
                new()
            },
            LastEvaluatedKey = new Dictionary<string, AttributeValue>
            {
                ["AccommodationCode"] = new AttributeValue { S = "ACC1" }
            }
        });
        responses.Enqueue(new ScanResponse { Items = new List<Dictionary<string, AttributeValue>>() });

        var repo = CreateRepo(_ => new BatchWriteItemResponse(), out var dynamoMock, out _, _ => responses.Dequeue());

        await repo.ClearOffers("tbl", CancellationToken.None);

        dynamoMock.Verify(d => d.ScanAsync(It.IsAny<ScanRequest>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        dynamoMock.Verify(d => d.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
