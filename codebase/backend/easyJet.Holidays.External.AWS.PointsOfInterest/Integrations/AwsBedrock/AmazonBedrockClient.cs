using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PointsOfInterest.Models;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Collections.Concurrent;

namespace PointsOfInterest.Integrations.AwsBedrock;

internal interface IBedrockClient
{
    Task EnrichPOIData(Resort resort);
}

internal sealed class BedrockClient : IBedrockClient
{
    private readonly IAmazonBedrockRuntime _bedrockClient;
    private readonly ILogger<BedrockClient> _logger;
    private readonly AwsBedrockClientOptions _options;
    private readonly JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private const int DefaultBatchSize = 10; // tune based on token usage
    private const int MaxConcurrentBatches = 8; // tune based on Bedrock limits

    public BedrockClient(
        IAmazonBedrockRuntime bedrockClient,
        ILogger<BedrockClient> logger,
        IOptions<AwsBedrockClientOptions> options)
    {
        _bedrockClient = bedrockClient;
        _logger = logger;
        _options = options.Value;
    }

    InvokeModelRequest CreateRequest(BedrockPrompt prompt)
    {
        var payload = new
        {
            anthropic_version = _options.AnthropicVersion,
            max_tokens = 2048,
            temperature = 0,
            system = prompt.SystemMessage,
            messages = new[]
            {
                new
                {
                    role = "user",
                    content = new[]
                    {
                        new
                        {
                            type = "text",
                            text = prompt.UserMessage
                        }
                    }
                }
            }
        };

        return new InvokeModelRequest
        {
            ContentType = "application/json",
            Accept = "application/json",
            ModelId = string.IsNullOrWhiteSpace(_options.InferenceProfileArn) ? _options.ModelId : _options.InferenceProfileArn,
            Body = new MemoryStream(JsonSerializer.SerializeToUtf8Bytes(payload))
        };
    }

    public async Task EnrichPOIData(Resort resort)
    {
        if (resort?.PointsOfInterests == null || resort.PointsOfInterests.Count == 0)
        {
            _logger.LogInformation("No POIs to enrich for resort {Resort}", resort?.ResortCode);
            return;
        }
        
        // we don't need to calculate N of visits for bus stops
        var poisWithoutNearby = resort.PointsOfInterests.Where(x => x.Category != "Nearby").ToList();

        var batches = BuildBatches(poisWithoutNearby, DefaultBatchSize).ToList();
        _logger.LogInformation("Created {BatchCount} batches (batch size target={BatchSize})", batches.Count, DefaultBatchSize);

        using var semaphore = new SemaphoreSlim(MaxConcurrentBatches); // dispose to satisfy CA2000
        var tasks = new List<Task>();
        var enrichedCounter = 0;

        // Local function to avoid Task.Run (fix CA1849 / S6966) while ensuring semaphore release
        async Task ProcessBatchAsync(List<PointOfInterest> batch)
        {
            try
            {
                await EnrichBatchAsync(batch, resort.ResortCode);
                Interlocked.Add(ref enrichedCounter, batch.Count);
            }
            finally
            {
                semaphore.Release();
            }
        }

        foreach (var batch in batches)
        {
            await semaphore.WaitAsync();
            tasks.Add(ProcessBatchAsync(batch));
        }

        await Task.WhenAll(tasks);
        _logger.LogInformation("Completed enrichment for resort {Resort}. POIs processed={Processed}", resort.ResortCode, enrichedCounter);
    }

    private async Task EnrichBatchAsync(List<PointOfInterest> batch, string resortCode)
    {
        var prompt = CreateBatchEnrichmentPrompt(batch);
        var request = CreateRequest(prompt);

        InvokeModelResponse response = new();
        try
        {
            response = await _bedrockClient.InvokeModelAsync(request);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Bedrock invocation failed for batch size {Size} (resort={Resort})", batch.Count, resortCode);
        }
        finally
        {
            if (request.Body is not null)
            {
                // Use async dispose to satisfy CA1849
                await request.Body.DisposeAsync();
            }
        }

        string raw;
        using (var sr = new StreamReader(response.Body, Encoding.UTF8, leaveOpen: false))
        {
            raw = await sr.ReadToEndAsync();
        }

        if (string.IsNullOrWhiteSpace(raw))
        {
            _logger.LogWarning("Empty response body from model {ModelId} (resort={Resort})", _options.ModelId, resortCode);
            return;
        }

        AnthropicResponse? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<AnthropicResponse>(raw, jsonOptions);
        }
        catch (Exception deserEx)
        {
            _logger.LogWarning(deserEx, "Failed to deserialize Anthropic response. Raw (truncated): {Raw}", Truncate(raw, 300));
            return;
        }

        var contentSegments = parsed?.Content?
            .Where(c => !string.IsNullOrWhiteSpace(c.Text))
            .Select(c => c.Text!.Trim());
        var content = contentSegments is null ? string.Empty : string.Join(Environment.NewLine, contentSegments.Where(s => !string.IsNullOrWhiteSpace(s)));
        if (string.IsNullOrWhiteSpace(content))
        {
            _logger.LogWarning("No assistant content in model output (model={Model}, resort={Resort}). Raw (truncated): {Raw}", _options.ModelId, resortCode, Truncate(raw, 300));
            return;
        }

        content = StripMarkdownFences(content);

        var enrichedList = TryParseEnrichedList(content);
        if (enrichedList == null)
        {
            _logger.LogWarning("Could not parse enriched POI JSON (resort={Resort}). Output (truncated): {Output}", resortCode, Truncate(content, 400));
            return;
        }

        var applied = ApplyEnrichment(batch, enrichedList);

        _logger.LogInformation("Batch enriched {Applied}/{Batch} POIs (resort={Resort})", applied, batch.Count, resortCode);
    }

    private static int ApplyEnrichment(List<PointOfInterest> batch, IReadOnlyList<EnrichedPoi> enrichedList)
    {
        // Map by PlaceId for quick lookup (case-insensitive)
        var map = batch.ToDictionary(p => p.PlaceId, StringComparer.OrdinalIgnoreCase);
        var applied = 0;
        foreach (var enriched in enrichedList)
        {
            if (string.IsNullOrWhiteSpace(enriched.PlaceId)) continue;
            if (!map.TryGetValue(enriched.PlaceId, out var poi)) continue;

            if (enriched.NumberOfVisits.HasValue)
                poi.NumberOfVisits = enriched.NumberOfVisits;
            if (enriched.AdultsOnly.HasValue)
                poi.AdultsOnly = enriched.AdultsOnly;
            applied++;
        }

        return applied;
    }

    private static IEnumerable<List<PointOfInterest>> BuildBatches(IEnumerable<PointOfInterest> pois, int batchSize)
    {
        // Group by category first for semantic coherence
        foreach (var group in pois.GroupBy(p => p.Category ?? string.Empty))
        {
            var list = group.ToList();
            for (int i = 0; i < list.Count; i += batchSize)
            {
                yield return list.Skip(i).Take(batchSize).ToList();
            }
        }
    }

    private BedrockPrompt CreateBatchEnrichmentPrompt(IReadOnlyCollection<PointOfInterest> pois)
    {
        // Minimise token usage: only send required fields + stable IDs & minimal contextual fields
        var minimal = pois.Select(p => new
        {
            p.PlaceId,
            p.PlaceType,
            p.Category,
            p.Position,
            Title = p.Title,
            p.AdultsOnly,
            p.NumberOfVisits
        });
        var json = JsonSerializer.Serialize(minimal, jsonOptions);

        const string instructions = """
You are enriching Points of Interest with two additional fields.
Return ONLY a JSON array (no markdown, no text) of objects with this exact schema:
[
  { "PlaceId": "string", "NumberOfVisits": 0, "AdultsOnly": true }
]
Rules:
- One object per input POI (do not add or remove).
- Keep PlaceId exactly as provided (case preserved).
- NumberOfVisits: realistic monthly visits (0-5000) integer.
- AdultsOnly: true if age restrictions of 18+ apply on entry requirements, else false.
- If unsure choose a conservative value.
""";
        return new BedrockPrompt(instructions, $"InputPOIs:\n{json}");
    }

    private IReadOnlyList<EnrichedPoi>? TryParseEnrichedList(string text)
    {
        // Isolate JSON array if extra characters included
        var start = text.IndexOf('[', StringComparison.Ordinal);
        var end = text.LastIndexOf(']');
        if (start < 0 || end <= start) return null;
        var slice = text[start..(end + 1)];
        try
        {
            var list = JsonSerializer.Deserialize<List<EnrichedPoi>>(slice, jsonOptions);
            if (list == null) return null;
            // Basic validation
            return list.Where(l => !string.IsNullOrWhiteSpace(l.PlaceId)).ToList();
        }
        catch
        {
            return null;
        }
    }

    private static string StripMarkdownFences(string value)
    {
        // Remove ```json fences if model added them
        if (value.StartsWith("```", StringComparison.Ordinal))
        {
            var firstNewLine = value.IndexOf('\n', StringComparison.Ordinal);
            var lastFence = value.LastIndexOf("```", StringComparison.Ordinal);
            if (firstNewLine >= 0 && lastFence > firstNewLine)
            {
                return value.Substring(firstNewLine + 1, lastFence - firstNewLine - 1).Trim();
            }
        }
        return value;
    }

    private static string Truncate(string value, int max)
       => value.Length <= max ? value : string.Concat(value.AsSpan(0, max), "...");

    #region DTOs

    private sealed record BedrockPrompt(string SystemMessage, string UserMessage);

    private sealed class EnrichedPoi
    {
        public string? PlaceId { get; init; } = string.Empty;
        public int? NumberOfVisits { get; init; } = 0;
        public bool? AdultsOnly { get; init; } = false;
    }

    private sealed class AnthropicResponse
    {
        [JsonPropertyName("id")] public string? Id { get; set; }
        [JsonPropertyName("model")] public string? Model { get; set; }
        [JsonPropertyName("stop_reason")] public string? StopReason { get; set; }
        [JsonPropertyName("content")] public List<AnthropicContent>? Content { get; set; }
    }

    private sealed class AnthropicContent
    {
        [JsonPropertyName("type")] public string? Type { get; set; }
        [JsonPropertyName("text")] public string? Text { get; set; }
    }

    #endregion
}
