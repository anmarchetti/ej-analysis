using PointsOfInterest.Integrations.AwsBedrock;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class MessageResponseTests
{
    [Fact]
    public void TryGetPointsOfInterest_ContentEmpty_ReturnsFalseAndError()
    {
        var msg = new MessageResponse { Content = "" };
        var ok = msg.TryGetPointsOfInterest(out var list, out var error);
        Assert.False(ok);
        Assert.NotNull(error);
        Assert.Equal("Content empty.", error);
        Assert.Empty(list);
    }

    [Fact]
    public void TryGetPointsOfInterest_ParsesSimpleArray()
    {
        var msg = new MessageResponse { Content = "[ {\"PlaceId\":\"P1\"} ]" };
        var ok = msg.TryGetPointsOfInterest(out var list, out var error);
        Assert.True(ok);
        Assert.Null(error);
        Assert.Single(list);
        Assert.Equal("P1", list[0].PlaceId);
    }

    [Fact]
    public void TryGetPointsOfInterest_StripsReasoningBlocks()
    {
        var content = "<reasoning>some chain of thought [ not json ]</reasoning>\n[ {\"PlaceId\":\"P2\"} ]";
        var msg = new MessageResponse { Content = content };
        var ok = msg.TryGetPointsOfInterest(out var list, out var error);
        Assert.True(ok);
        Assert.Null(error);
        Assert.Single(list);
        Assert.Equal("P2", list[0].PlaceId);
    }

    [Fact]
    public void TryGetPointsOfInterest_StripsCodeFences()
    {
        var content = "```json\n[ {\"PlaceId\":\"P3\"} ]\n```";
        var msg = new MessageResponse { Content = content };
        var ok = msg.TryGetPointsOfInterest(out var list, out var error);
        Assert.True(ok);
        Assert.Null(error);
        Assert.Single(list);
        Assert.Equal("P3", list[0].PlaceId);
    }

    [Fact]
    public void TryGetPointsOfInterest_UnbalancedArray_ReturnsError()
    {
        var content = "[ { \"PlaceId\": \"P4\" }"; // missing closing ]
        var msg = new MessageResponse { Content = content };
        var ok = msg.TryGetPointsOfInterest(out var list, out var error);
        Assert.False(ok);
        Assert.StartsWith("JSON array not found: Unbalanced JSON array brackets.", error, StringComparison.Ordinal);
        Assert.Empty(list);
    }

    [Fact]
    public void TryGetPointsOfInterest_InvalidJson_ReturnsDeserializationError()
    {
        var content = "[ { \"PlaceId\": \"P5\", } ]"; // trailing comma invalid JSON
        var msg = new MessageResponse { Content = content };
        var ok = msg.TryGetPointsOfInterest(out var list, out var error);
        Assert.False(ok);
        Assert.NotNull(error);
        Assert.StartsWith("Deserialization failed:", error, StringComparison.Ordinal);
    }

    [Fact]
    public void TryGetPointsOfInterest_CachesResult()
    {
        var msg = new MessageResponse { Content = "[ {\"PlaceId\":\"PX\"} ]" };
        var ok1 = msg.TryGetPointsOfInterest(out var list1, out var error1);
        var ok2 = msg.TryGetPointsOfInterest(out var list2, out var error2);
        Assert.True(ok1);
        Assert.True(ok2); // Should still be true and not re-parse
        Assert.Null(error1);
        Assert.Null(error2);
        Assert.True(object.ReferenceEquals(list1, list2));
    }
}
