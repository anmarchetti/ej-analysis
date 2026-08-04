using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using PointsOfInterest.Ancillaries;
using PointsOfInterest.Models;
using System.Text.Json;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class PointOfInterestRepositoryTests
{
    private const string TableName = "PoiTable";

    private static Resort CreateResort(string code, int poiCount)
    {
        var resort = new Resort
        {
            ResortCode = code,
            ResortName = code + " Name",
            QueryPositionLatitude = 10.1,
            QueryPositionLongitude = 20.2,
            PointsOfInterests = new List<PointOfInterest>(),
            Hotels = new List<Hotel>(),
            Theme = "Active",
            CountryCode = "GB"
        };
        for (int i = 0; i < poiCount; i++)
        {
            resort.PointsOfInterests.Add(new PointOfInterest
            {
                Category = "Cat" + i,
                PlaceId = "PID" + i,
                Position = new List<double> { 1 + i, 2 + i },
                PlaceType = "Type" + i,
                NumberOfVisits = i,
                AdultsOnly = i % 2 == 0 ? true : (bool?)null,
                Title = new Dictionary<string,string>{{"en","Title"+i}}
            });
        }
        return resort;
    }

    private static IPointOfInterestRepository CreateRepository(Mock<IAmazonDynamoDB> dynamoMock, List<BatchWriteItemRequest> captured)
    {
        var logger = Mock.Of<ILogger<PointOfInterestRepository>>();
        dynamoMock.Setup(d => d.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BatchWriteItemRequest req, CancellationToken _) =>
            {
                captured.Add(req);
                return new BatchWriteItemResponse { UnprocessedItems = new Dictionary<string, List<WriteRequest>>() };
            });

        var options = Options.Create(new AwsPlacesDynamoOptions { PointOfInterestTableName = TableName });
        return new PointOfInterestRepository(logger, dynamoMock.Object, options);
    }

    // Constructor coverage tests (public API only)
    [Fact]
    public void Constructor_ValidDependencies_Succeeds()
    {
        var repo = new PointOfInterestRepository(Mock.Of<ILogger<PointOfInterestRepository>>(), Mock.Of<IAmazonDynamoDB>(), Options.Create(new AwsPlacesDynamoOptions { PointOfInterestTableName = TableName }));
        Assert.NotNull(repo);
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_WritesItemsAndDeletesExistingForSpecificCodes()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);

        dynamo.Setup(d => d.QueryAsync(It.Is<QueryRequest>(q => q.ExpressionAttributeValues[":rc"].S == "R1"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse
            {
                Items = Enumerable.Range(0, 3).Select(i => new Dictionary<string, AttributeValue>
                {
                    [nameof(Resort.ResortCode)] = new AttributeValue { S = "R1" },
                    [nameof(PointOfInterest.PlaceId)] = new AttributeValue { S = "PID" + i }
                }).ToList(),
                LastEvaluatedKey = new Dictionary<string, AttributeValue>()
            });
        dynamo.Setup(d => d.QueryAsync(It.Is<QueryRequest>(q => q.ExpressionAttributeValues[":rc"].S != "R1"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse { Items = new List<Dictionary<string, AttributeValue>>() });

        var resorts = new List<Resort> { CreateResort("R1", 2) };
        await repo.RefreshResortPoiByResorts(resorts);

        Assert.NotEmpty(captured);
        Assert.Contains(captured, r => r.RequestItems[TableName].All(w => w.DeleteRequest != null));
        Assert.Contains(captured, r => r.RequestItems[TableName].All(w => w.PutRequest != null));

        var putRequest = captured.First(r => r.RequestItems[TableName].All(w => w.PutRequest != null))
            .RequestItems[TableName].First().PutRequest.Item;
        Assert.True(putRequest.ContainsKey("Id"));
        Assert.Equal("R1", putRequest[nameof(Resort.ResortCode)].S);
        Assert.Equal("R1 Name", putRequest[nameof(Resort.ResortName)].S);
        Assert.True(putRequest.ContainsKey("CreatedAt"));
        Assert.Equal(false, putRequest["Hidden"].BOOL);
        Assert.Equal(false, putRequest["Keep"].BOOL);
        Assert.True(putRequest.ContainsKey(nameof(Resort.QueryPositionLatitude)));
        Assert.True(putRequest.ContainsKey(nameof(Resort.QueryPositionLongitude)));
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_FlushesAtBatchBoundary()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);

        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse { Items = new List<Dictionary<string, AttributeValue>>() });

        var resorts = new List<Resort> { CreateResort("R1", 26) }; // 26 -> 2 batches
        await repo.RefreshResortPoiByResorts(resorts);

        var putBatches = captured.Where(r => r.RequestItems[TableName].All(w => w.PutRequest != null)).ToList();
        Assert.Equal(2, putBatches.Count);
        Assert.Equal(25, putBatches[0].RequestItems[TableName].Count);
        Assert.Single(putBatches[1].RequestItems[TableName]);
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_DeleteRetriesOnUnprocessedItems()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();

        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse
            {
                Items = new List<Dictionary<string, AttributeValue>>
                {
                    new() {
                        [nameof(Resort.ResortCode)] = new AttributeValue { S = "R1" },
                        [nameof(PointOfInterest.PlaceId)] = new AttributeValue { S = "PID1" }
                    }
                }
            });

        int deleteCall = 0;
        dynamo.Setup(d => d.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BatchWriteItemRequest req, CancellationToken _) =>
            {
                captured.Add(req);
                if (req.RequestItems[TableName].All(w => w.DeleteRequest != null))
                {
                    if (deleteCall == 0)
                    {
                        deleteCall++;
                        return new BatchWriteItemResponse
                        {
                            UnprocessedItems = new Dictionary<string, List<WriteRequest>>
                            {
                                [TableName] = req.RequestItems[TableName]
                            }
                        };
                    }
                }
                return new BatchWriteItemResponse { UnprocessedItems = new Dictionary<string, List<WriteRequest>>() };
            });

        var repo = new PointOfInterestRepository(Mock.Of<ILogger<PointOfInterestRepository>>(), dynamo.Object, Options.Create(new AwsPlacesDynamoOptions { PointOfInterestTableName = TableName }));
        await repo.RefreshResortPoiByResorts(new List<Resort> { CreateResort("R1", 1) });

        var deleteBatches = captured.Where(r => r.RequestItems[TableName].All(w => w.DeleteRequest != null)).ToList();
        Assert.Equal(2, deleteBatches.Count); // initial + retry
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_DeleteSkipsItemsMissingKeys()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);

        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse
            {
                Items = new List<Dictionary<string, AttributeValue>>
                {
                    new() { [nameof(Resort.ResortCode)] = new AttributeValue { S = "R1" } }
                }
            });

        await repo.RefreshResortPoiByResorts(new List<Resort> { CreateResort("R1", 0) });
        Assert.DoesNotContain(captured, r => r.RequestItems[TableName].Any(w => w.DeleteRequest != null));
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_DoesNotDeleteItemsMarkedKeep()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);

        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse
            {
                Items = new List<Dictionary<string, AttributeValue>>
                {
                    new()
                    {
                        [nameof(Resort.ResortCode)] = new AttributeValue { S = "R1" },
                        [nameof(PointOfInterest.PlaceId)] = new AttributeValue { S = "PID_KEEP" },
                        ["Keep"] = new AttributeValue { BOOL = true }
                    },
                    new()
                    {
                        [nameof(Resort.ResortCode)] = new AttributeValue { S = "R1" },
                        [nameof(PointOfInterest.PlaceId)] = new AttributeValue { S = "PID_DELETE" },
                        ["Keep"] = new AttributeValue { BOOL = false }
                    }
                }
            });

        await repo.RefreshResortPoiByResorts(new List<Resort> { CreateResort("R1", 0) });

        var deleteRequests = captured.Where(r => r.RequestItems[TableName].All(w => w.DeleteRequest != null)).ToList();
        Assert.Single(deleteRequests);

        var deletedPlaceIds = deleteRequests
            .SelectMany(r => r.RequestItems[TableName])
            .Select(w => w.DeleteRequest!.Key![nameof(PointOfInterest.PlaceId)].S)
            .ToList();

        Assert.Contains("PID_DELETE", deletedPlaceIds);
        Assert.DoesNotContain("PID_KEEP", deletedPlaceIds);
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_NoDeleteWhenNoCodes()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);

        await repo.RefreshResortPoiByResorts(new List<Resort>()); // empty list -> nothing
        Assert.Empty(captured);
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_KeepAttributeNullDeletesItem()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);

        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse
            {
                Items = new List<Dictionary<string, AttributeValue>>
                {
                    new()
                    {
                        [nameof(Resort.ResortCode)] = new AttributeValue { S = "R1" },
                        [nameof(PointOfInterest.PlaceId)] = new AttributeValue { S = "PID_NULL" },
                        ["Keep"] = new AttributeValue { NULL = true }
                    }
                }
            });

        await repo.RefreshResortPoiByResorts(new List<Resort> { CreateResort("R1", 0) });

        var deleteRequests = captured.Where(r => r.RequestItems[TableName].All(w => w.DeleteRequest != null)).ToList();
        Assert.Single(deleteRequests);
        var deletedId = deleteRequests
            .SelectMany(r => r.RequestItems[TableName])
            .Select(w => w.DeleteRequest!.Key![nameof(PointOfInterest.PlaceId)].S)
            .Single();
        Assert.Equal("PID_NULL", deletedId);
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_PaginatesDeleteQueries()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);

        var firstBatch = new QueryResponse
        {
            Items = new List<Dictionary<string, AttributeValue>>
            {
                new()
                {
                    [nameof(Resort.ResortCode)] = new AttributeValue { S = "R1" },
                    [nameof(PointOfInterest.PlaceId)] = new AttributeValue { S = "PID_1" }
                }
            },
            LastEvaluatedKey = new Dictionary<string, AttributeValue>
            {
                ["Marker"] = new AttributeValue { S = "next" }
            }
        };

        var secondBatch = new QueryResponse
        {
            Items = new List<Dictionary<string, AttributeValue>>
            {
                new()
                {
                    [nameof(Resort.ResortCode)] = new AttributeValue { S = "R1" },
                    [nameof(PointOfInterest.PlaceId)] = new AttributeValue { S = "PID_2" }
                }
            }
        };

        dynamo.SetupSequence(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(firstBatch)
            .ReturnsAsync(secondBatch);

        await repo.RefreshResortPoiByResorts(new List<Resort> { CreateResort("R1", 0) });

        dynamo.Verify(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()), Times.Exactly(2));

        var deleteRequests = captured.Where(r => r.RequestItems[TableName].All(w => w.DeleteRequest != null)).ToList();
        Assert.Single(deleteRequests);
        var deletedIds = deleteRequests
            .SelectMany(r => r.RequestItems[TableName])
            .Select(w => w.DeleteRequest!.Key![nameof(PointOfInterest.PlaceId)].S)
            .ToList();
        Assert.Contains("PID_1", deletedIds);
        Assert.Contains("PID_2", deletedIds);
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_SkipsResortsWithNoPois()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);
        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse { Items = new List<Dictionary<string, AttributeValue>>() });

        var resortEmpty = CreateResort("R_EMPTY", 0); // no POIs
        await repo.RefreshResortPoiByResorts(new List<Resort> { resortEmpty });
        Assert.DoesNotContain(captured, r => r.RequestItems[TableName].Any(w => w.PutRequest != null));
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_MultipleResorts_FlushAcrossResorts()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);
        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse { Items = new List<Dictionary<string, AttributeValue>>() });

        var resorts = new List<Resort> { CreateResort("R1", 25), CreateResort("R2", 25) }; // exactly two full batches
        await repo.RefreshResortPoiByResorts(resorts);

        var putBatches = captured.Where(r => r.RequestItems[TableName].All(w => w.PutRequest != null)).ToList();
        Assert.Equal(2, putBatches.Count);
        Assert.All(putBatches, b => Assert.Equal(25, b.RequestItems[TableName].Count));
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_PoiAttributesConvertedProperly()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);
        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse { Items = new List<Dictionary<string, AttributeValue>>() });

        var resort = new Resort
        {
            ResortCode = "RATTR",
            ResortName = "Resort Attr",
            QueryPositionLatitude = 51.1234,
            QueryPositionLongitude = -0.9876,
            PointsOfInterests = new List<PointOfInterest>
            {
                new()
                {
                    Category = "Food",
                    PrimaryCategory = new Category { Id = "restaurant", Name = "Restaurant" },
                    PlaceId = "FOOD1",
                    Position = new List<double>{ 52.1, 0.2 },
                    PlaceType = "Eat",
                    AdultsOnly = true,
                    NumberOfVisits = 42,
                    Title = new Dictionary<string,string>{{"en","The Place"},{"fr","Le Lieu"}}
                }
            }
        };

        await repo.RefreshResortPoiByResorts(new List<Resort> { resort });
        var putBatch = captured.Single(r => r.RequestItems[TableName].All(w => w.PutRequest != null));
        var item = putBatch.RequestItems[TableName].Single().PutRequest.Item;

        Assert.True(item.ContainsKey("PrimaryCategory"));
        Assert.Equal("restaurant", item["PrimaryCategory"].M["Id"].S);
        Assert.Equal("Restaurant", item["PrimaryCategory"].M["Name"].S);
        Assert.True(item.ContainsKey("Title"));
        Assert.Equal(2, item["Title"].M.Count);
        Assert.Equal("The Place", item["Title"].M["en"].S);
        Assert.Equal("42", item[nameof(PointOfInterest.NumberOfVisits)].N);
        Assert.True(item[nameof(PointOfInterest.AdultsOnly)].BOOL);
        Assert.Equal("51.1234", item[nameof(Resort.QueryPositionLatitude)].N);
        Assert.Equal("-0.9876", item[nameof(Resort.QueryPositionLongitude)].N);
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_AdultsOnlyNullExcluded()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);
        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse { Items = new List<Dictionary<string, AttributeValue>>() });

        var resort = new Resort
        {
            ResortCode = "RNULL",
            ResortName = "Resort Null",
            QueryPositionLatitude = 1,
            QueryPositionLongitude = 2,
            PointsOfInterests = new List<PointOfInterest>
            {
                new()
                {
                    Category = "Sight",
                    PlaceId = "S1",
                    Position = new List<double>{ 1,2 },
                    PlaceType = "See",
                    AdultsOnly = null,
                    NumberOfVisits = 5,
                    Title = new Dictionary<string,string>{{"en","View"}}
                }
            }
        };

        await repo.RefreshResortPoiByResorts(new List<Resort> { resort });
        var putItem = captured.Single(r => r.RequestItems[TableName].All(w => w.PutRequest != null))
            .RequestItems[TableName].Single().PutRequest.Item;

        Assert.False(putItem.ContainsKey(nameof(PointOfInterest.AdultsOnly))); // excluded when null
    }

    [Fact]
    public async Task DeleteItemsByResortCode_MultipleDeleteBatches()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);

        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse
            {
                Items = Enumerable.Range(0,30).Select(i => new Dictionary<string, AttributeValue>
                {
                    [nameof(Resort.ResortCode)] = new AttributeValue { S = "RDEL" },
                    [nameof(PointOfInterest.PlaceId)] = new AttributeValue { S = "PID_" + i }
                }).ToList()
            });

        await repo.RefreshResortPoiByResorts(new List<Resort> { CreateResort("RDEL", 0) });

        var deleteBatches = captured.Where(r => r.RequestItems[TableName].All(w => w.DeleteRequest != null)).ToList();
        Assert.Equal(2, deleteBatches.Count); // 25 + 5
        Assert.Equal(25, deleteBatches[0].RequestItems[TableName].Count);
        Assert.Equal(5, deleteBatches[1].RequestItems[TableName].Count);
    }

    [Fact]
    public async Task DeleteItemsByResortCode_MaxRetriesFailure()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();

        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse
            {
                Items = new List<Dictionary<string, AttributeValue>>
                {
                    new() {
                        [nameof(Resort.ResortCode)] = new AttributeValue { S = "RFAIL" },
                        [nameof(PointOfInterest.PlaceId)] = new AttributeValue { S = "PID_FAIL" }
                    }
                }
            });

        dynamo.Setup(d => d.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BatchWriteItemRequest req, CancellationToken _) =>
            {
                captured.Add(req);
                return new BatchWriteItemResponse
                {
                    UnprocessedItems = new Dictionary<string, List<WriteRequest>>
                    {
                        [TableName] = req.RequestItems[TableName]
                    }
                };
            });

        var repo = new PointOfInterestRepository(Mock.Of<ILogger<PointOfInterestRepository>>(), dynamo.Object, Options.Create(new AwsPlacesDynamoOptions { PointOfInterestTableName = TableName }));
        await repo.RefreshResortPoiByResorts(new List<Resort> { CreateResort("RFAIL", 0) });
        Assert.Equal(5, captured.Count(r => r.RequestItems[TableName].All(w => w.DeleteRequest != null))); // MaxDeleteRetries
    }

    [Fact]
    public async Task RefreshResortPoiByResorts_PutItemsExcludeReservedPoiKeys()
    {
        var captured = new List<BatchWriteItemRequest>();
        var dynamo = new Mock<IAmazonDynamoDB>();
        var repo = CreateRepository(dynamo, captured);
        dynamo.Setup(d => d.QueryAsync(It.IsAny<QueryRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueryResponse { Items = new List<Dictionary<string, AttributeValue>>() });

        var resort = CreateResort("RSKIP", 1);
        await repo.RefreshResortPoiByResorts(new List<Resort> { resort });

        var putItem = captured.Single(r => r.RequestItems[TableName].All(w => w.PutRequest != null))
            .RequestItems[TableName].Single().PutRequest.Item;

        // Keys added by repository present
        Assert.True(putItem.ContainsKey("Id"));
        Assert.True(putItem.ContainsKey("CreatedAt"));
        Assert.True(putItem.ContainsKey("Hidden"));
        Assert.True(putItem.ContainsKey("Keep"));
        Assert.True(putItem.ContainsKey(nameof(Resort.QueryPositionLatitude)));
        Assert.True(putItem.ContainsKey(nameof(Resort.QueryPositionLongitude)));
    }

    [Fact]
    public void BuildPoiData_SkipsReservedKeysWhenOverrideProvided()
    {
        var overrideMap = new Dictionary<string, AttributeValue>
        {
            ["Id"] = new AttributeValue { S = "manual" },
            ["Keep"] = new AttributeValue { BOOL = true },
            ["Custom"] = new AttributeValue { S = "value" }
        };

        var item = new Dictionary<string, AttributeValue>();
        var poi = new PointOfInterest { PlaceId = "PID_X" };

        PointOfInterestRepository.BuildPoiData(poi, item, overrideMap);

        Assert.False(item.ContainsKey("Id"));
        Assert.False(item.ContainsKey("Keep"));
        Assert.Equal("value", item["Custom"].S);
    }

    [Fact]
    public void FromJsonElement_NullProducesNullAttribute()
    {
        using var doc = JsonDocument.Parse("null");
        var attr = PointOfInterestRepository.FromJsonElement(doc.RootElement);
        Assert.True(attr.NULL);
    }

    [Fact]
    public void FromJsonElement_UndefinedFallsBackToString()
    {
        var undefinedElement = default(JsonElement); // ValueKind == Undefined
        var attr = PointOfInterestRepository.FromJsonElement(undefinedElement);
        Assert.Equal(string.Empty, attr.S);
    }
}
