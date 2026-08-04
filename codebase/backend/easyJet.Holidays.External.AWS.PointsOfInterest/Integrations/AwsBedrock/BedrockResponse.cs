using PointsOfInterest.Models;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PointsOfInterest.Integrations.AwsBedrock;

internal sealed record BedrockResponse
{
    public List<BedrockContent> Choices { get; init; } = new();
    public int Created { get; init; }
    public string Id { get; init; } = string.Empty;
    public string Model { get; init; } = string.Empty; 

    public string Object { get; init; } = string.Empty;

    [JsonPropertyName("service_tier")]
    public string ServiceTier { get; init; } = string.Empty;

    [JsonPropertyName("usage")]
    public BedrockUsage Usage { get; init; } = new();
}

internal sealed record BedrockUsage
{
    [JsonPropertyName("completion_tokens")]
    public int CompletionTokens { get; init; }

    [JsonPropertyName("prompt_tokens")]
    public int PromptTokens { get; init; }

    [JsonPropertyName("prompt_tokens_details")]
    public PromptTokensDetails PromptTokensDetails { get; init; } = new();

    [JsonPropertyName("total_tokens")]
    public int TotalTokens { get; init; }
}

internal sealed record PromptTokensDetails
{
    [JsonPropertyName("audio_tokens")]
    public int AudioTokens { get; init; }

    [JsonPropertyName("cached_tokens")]
    public int CachedTokens { get; init; }
}

internal sealed record BedrockContent
{
    public MessageResponse Message { get; init; } = new();
}

internal sealed class MessageResponse
{
    public string Content { get; init; } = string.Empty;
    private List<PointOfInterest>? _cache;
    private string? _lastError;

    private static readonly JsonSerializerOptions s_jsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip
    };

    public IReadOnlyList<PointOfInterest> GetPointsOfInterest() =>
        _cache ??= (TryGetPointsOfInterest(out var list, out _) ? list : new List<PointOfInterest>());

    public bool TryGetPointsOfInterest(out List<PointOfInterest> pois, out string? error)
    {
        if (_cache is not null)
        {
            pois = _cache;
            error = _lastError;
            return error is null;
        }

        pois = new();
        error = null;

        if (string.IsNullOrWhiteSpace(Content))
        {
            error = "Content empty.";
            _lastError = error;
            return false;
        }

        string stripped = StripReasoningBlocks(Content);
        stripped = StripCodeFences(stripped);

        if (!TryExtractFirstJsonArray(stripped, out var jsonArray, out var extractError))
        {
            error = $"JSON array not found: {extractError}";
            _lastError = error;
            return false;
        }

        try
        {
            // Fast path: direct deserialize
            pois = JsonSerializer.Deserialize<List<PointOfInterest>>(jsonArray, s_jsonOptions) ?? new List<PointOfInterest>();
            _cache = pois;
            return true;
        }
        catch (JsonException jex)
        {
            error = $"Deserialization failed: {jex.Message}";
            _lastError = error;
            return false;
        }
    }

    private static string StripReasoningBlocks(string input)
    {
        var sb = new StringBuilder(input.Length);
        int idx = 0;
        while (idx < input.Length)
        {
            int open = input.IndexOf("<reasoning", idx, StringComparison.OrdinalIgnoreCase);
            if (open < 0)
            {
                sb.Append(input, idx, input.Length - idx);
                break;
            }

            sb.Append(input, idx, open - idx);

            int close = input.IndexOf("</reasoning>", open, StringComparison.OrdinalIgnoreCase);
            if (close < 0)
            {
                sb.Append(input, open, input.Length - open);
                break;
            }

            idx = close + "</reasoning>".Length;
        }
        return sb.ToString();
    }

    private static string StripCodeFences(string input)
    {
        var trimmed = input.Trim();
        if (trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            int firstNewLine = trimmed.IndexOf('\n', StringComparison.Ordinal);
            if (firstNewLine > 0)
                trimmed = trimmed[(firstNewLine + 1)..];

            int lastFence = trimmed.LastIndexOf("```", StringComparison.Ordinal);
            if (lastFence >= 0)
                trimmed = trimmed[..lastFence];
        }
        return trimmed.Trim();
    }

    // --- Refactored (S3776) ---
    private static bool TryExtractFirstJsonArray(string input, out string jsonArray, out string? error)
    {
        jsonArray = string.Empty;
        error = null;

        int start = FindArrayStart(input);
        if (start < 0)
        {
            error = "No '[' found.";
            return false;
        }

        if (!TryFindArrayEnd(input, start, out int end, out error))
            return false;

        jsonArray = input.Substring(start, end - start + 1);
        return true;
    }

    private static int FindArrayStart(string input) => input.IndexOf('[', StringComparison.Ordinal);

    private static bool TryFindArrayEnd(string input, int start, out int endIndex, out string? error)
    {
        bool inString = false;
        bool escape = false;
        int depth = 0;
        for (int i = start; i < input.Length; i++)
        {
            char c = input[i];
            if (inString)
            {
                if (escape) { escape = false; }
                else if (c == '\\') { escape = true; }
                else if (c == '"') { inString = false; }
                continue;
            }
            switch (c)
            {
                case '"':
                    inString = true;
                    break;
                case '[':
                    depth++;
                    break;
                case ']':
                    depth--;
                    if (depth == 0)
                    {
                        endIndex = i;
                        error = null;
                        return true;
                    }
                    break;
            }
        }
        endIndex = -1;
        error = "Unbalanced JSON array brackets.";
        return false;
    }
}