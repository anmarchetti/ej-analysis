using System.IO;
using System.Text;
using System.Text.Json;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using PointsOfInterest.Integrations.AwsBedrock;
using PointsOfInterest.Models;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class BedrockClientTests
{
    [Fact]
    public async Task EnrichPOIData_UpdatesPoiFields()
    {
        var runtime = new Mock<IAmazonBedrockRuntime>();
        var responseJson = """
{
  "id": "msg_01",
  "model": "anthropic.claude-haiku-4-5-20251001-v1:0",
  "stop_reason": "end_turn",
  "content": [
    {
      "type": "text",
      "text": "[ {\"PlaceId\":\"P1\",\"NumberOfVisits\":123,\"AdultsOnly\":true} ]"
    }
  ]
}
""";
        InvokeModelRequest? sentRequest = null;
        runtime.Setup(r => r.InvokeModelAsync(It.IsAny<InvokeModelRequest>(), It.IsAny<CancellationToken>()))
            .Callback<InvokeModelRequest, CancellationToken>((req, _) => sentRequest = req)
            .ReturnsAsync(new InvokeModelResponse{ Body = new MemoryStream(Encoding.UTF8.GetBytes(responseJson)) });
        var client = new BedrockClient(
            runtime.Object,
            Mock.Of<ILogger<BedrockClient>>(),
            Options.Create(new AwsBedrockClientOptions
            {
                ModelId = "anthropic.claude-haiku-4-5-20251001-v1:0",
                InferenceProfileArn = "arn:aws:bedrock:eu-west-1:123456789012:inference-profile/test",
                AnthropicVersion = "20251001"
            }));

        var poi = new PointOfInterest{ PlaceId = "P1", PlaceType = "Type", Category = "Cat", Position = new List<double>{0,0}, Title = new Dictionary<string,string>()};
        var resort = new Resort{ ResortCode = "R", ResortName = "RName", Hotels = new List<Hotel>(), Theme = "Active", QueryPositionLatitude = 1, QueryPositionLongitude = 2, PointsOfInterests = new List<PointOfInterest>{ poi } };
        await client.EnrichPOIData(resort);

        Assert.Equal(123, poi.NumberOfVisits);
        Assert.True(poi.AdultsOnly);
        Assert.Equal("arn:aws:bedrock:eu-west-1:123456789012:inference-profile/test", sentRequest?.ModelId);
    }

    [Fact]
    public async Task EnrichPOIData_NoPois_NoCalls()
    {
        var runtime = new Mock<IAmazonBedrockRuntime>();
        var client = new BedrockClient(
            runtime.Object,
            Mock.Of<ILogger<BedrockClient>>(),
            Options.Create(new AwsBedrockClientOptions
            {
                ModelId = "anthropic.claude-haiku-4-5-20251001-v1:0",
                InferenceProfileArn = "arn:aws:bedrock:eu-west-1:123456789012:inference-profile/test",
                AnthropicVersion = "20251001"
            }));
        var resort = new Resort{ ResortCode = "R", ResortName = "RName", Hotels = new List<Hotel>(), Theme = "Active", QueryPositionLatitude = 1, QueryPositionLongitude = 2, PointsOfInterests = new List<PointOfInterest>() };
        await client.EnrichPOIData(resort);
        runtime.Verify(r => r.InvokeModelAsync(It.IsAny<InvokeModelRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task EnrichPOIData_SkipsNearbyCategoryAndStripsMarkdownFences()
    {
        var runtime = new Mock<IAmazonBedrockRuntime>();
        string? payload = null;
        const string responsePayload = """
{
  "content": [
    {
      "type": "text",
      "text": "```json\n[{\"PlaceId\":\"P2\",\"NumberOfVisits\":42,\"AdultsOnly\":false}]\n```"
    }
  ]
}
""";

        runtime.Setup(r => r.InvokeModelAsync(It.IsAny<InvokeModelRequest>(), It.IsAny<CancellationToken>()))
            .Callback<InvokeModelRequest, CancellationToken>((req, _) =>
            {
                req.Body.Seek(0, SeekOrigin.Begin);
                using var reader = new StreamReader(req.Body, Encoding.UTF8, leaveOpen: true);
                payload = reader.ReadToEnd();
                req.Body.Seek(0, SeekOrigin.Begin);
            })
            .ReturnsAsync(new InvokeModelResponse
            {
                Body = new MemoryStream(Encoding.UTF8.GetBytes(responsePayload))
            });

        var client = new BedrockClient(
            runtime.Object,
            Mock.Of<ILogger<BedrockClient>>(),
            Options.Create(new AwsBedrockClientOptions
            {
                ModelId = "anthropic.claude-haiku-4-5-20251001-v1:0",
                InferenceProfileArn = "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
                AnthropicVersion = "20251001"
            }));

        var resort = new Resort
        {
            ResortCode = "R",
            ResortName = "RName",
            Hotels = new List<Hotel>(),
            Theme = "Active",
            QueryPositionLatitude = 1,
            QueryPositionLongitude = 2,
            PointsOfInterests = new List<PointOfInterest>
            {
                new() { PlaceId = "P1", Category = "Nearby", PlaceType = "Type", Position = new List<double>{0,0}, Title = new Dictionary<string,string>() },
                new() { PlaceId = "P2", Category = "Food", PlaceType = "Type", Position = new List<double>{0,0}, Title = new Dictionary<string,string>() }
            }
        };

        await client.EnrichPOIData(resort);

        runtime.Verify(r => r.InvokeModelAsync(It.IsAny<InvokeModelRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        Assert.NotNull(payload);
        using (var doc = JsonDocument.Parse(payload!))
        {
            var text = doc.RootElement.GetProperty("messages")[0].GetProperty("content")[0].GetProperty("text").GetString();
            Assert.NotNull(text);
            Assert.DoesNotContain("P1", text, StringComparison.Ordinal);
            Assert.Contains("P2", text, StringComparison.Ordinal);
        }

        var nearby = resort.PointsOfInterests.First(p => p.PlaceId == "P1");
        var enriched = resort.PointsOfInterests.First(p => p.PlaceId == "P2");
        Assert.Null(nearby.NumberOfVisits);
        Assert.Equal(42, enriched.NumberOfVisits);
        Assert.False(enriched.AdultsOnly);
    }

    [Fact]
    public async Task EnrichPOIData_InvalidJson_DoesNotModifyPois()
    {
        var runtime = new Mock<IAmazonBedrockRuntime>();
        runtime.Setup(r => r.InvokeModelAsync(It.IsAny<InvokeModelRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new InvokeModelResponse
            {
                Body = new MemoryStream(Encoding.UTF8.GetBytes("""
{
  "content": [
    { "type": "text", "text": "not json" }
  ]
}
"""))
            });

        var client = new BedrockClient(
            runtime.Object,
            Mock.Of<ILogger<BedrockClient>>(),
            Options.Create(new AwsBedrockClientOptions
            {
                ModelId = "anthropic.claude-haiku", 
                InferenceProfileArn = "eu.anthropic.claude-haiku",
                AnthropicVersion = "20251001"
            }));

        var poi = new PointOfInterest { PlaceId = "P1", Category = "Food", PlaceType = "Type", Position = new List<double> { 0, 0 }, Title = new Dictionary<string, string>() };
        var resort = new Resort { ResortCode = "R", ResortName = "RName", Hotels = new List<Hotel>(), Theme = "Active", QueryPositionLatitude = 1, QueryPositionLongitude = 2, PointsOfInterests = new List<PointOfInterest> { poi } };

        await client.EnrichPOIData(resort);

        Assert.Null(poi.NumberOfVisits);
        Assert.Null(poi.AdultsOnly);
    }

    [Fact]
    public async Task EnrichPOIData_EmptyResponseBody_DoesNothing()
    {
        var runtime = new Mock<IAmazonBedrockRuntime>();
        runtime.Setup(r => r.InvokeModelAsync(It.IsAny<InvokeModelRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new InvokeModelResponse { Body = new MemoryStream() });

        var client = new BedrockClient(
            runtime.Object,
            Mock.Of<ILogger<BedrockClient>>(),
            Options.Create(new AwsBedrockClientOptions
            {
                ModelId = "anthropic.claude-haiku", 
                InferenceProfileArn = "eu.anthropic.claude-haiku",
                AnthropicVersion = "20251001"
            }));

        var poi = new PointOfInterest { PlaceId = "P1", Category = "Food", PlaceType = "Type", Position = new List<double> { 0, 0 }, Title = new Dictionary<string, string>() };
        var resort = new Resort { ResortCode = "R", ResortName = "RName", Hotels = new List<Hotel>(), Theme = "Active", QueryPositionLatitude = 1, QueryPositionLongitude = 2, PointsOfInterests = new List<PointOfInterest> { poi } };

        await client.EnrichPOIData(resort);

        runtime.Verify(r => r.InvokeModelAsync(It.IsAny<InvokeModelRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        Assert.Null(poi.NumberOfVisits);
        Assert.Null(poi.AdultsOnly);
    }
}
