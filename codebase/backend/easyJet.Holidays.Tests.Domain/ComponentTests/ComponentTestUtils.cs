using System.Text;
using System.Text.Json;

namespace easyJet.Holidays.Tests.Domain.Integration;

/// <summary>
/// Helper class for component tests
/// </summary>
public static class ComponentTestUtils
{
    /// <summary>
    /// Returns the content of a JSON file as string
    /// </summary>
    /// <param name="path">File path, __admin/files/ is added automatically</param>
    /// <param name="minify">JSON will be minified if true</param>
    /// <returns></returns>
    public static string GetJsonString(string path, bool minify = false)
    {
        var pathParts = path.Split(new[] { '/', '\\' }, StringSplitOptions.RemoveEmptyEntries);
        var fullPath = Path.Combine(pathParts.Prepend("files").Prepend("__admin").ToArray());
        var content = File.ReadAllText(fullPath);
        return minify ? ObjectUtils.MinifyJson(content) : content;
    }

    /// <summary>
    /// Returns StringContent with UTF-8 encoding and application/json media type
    /// </summary>
    /// <param name="content">Content string</param>
    /// <returns></returns>
    public static StringContent GetJsonContent(string content)
    {
        return new StringContent(content, Encoding.UTF8, "application/json");
    }

    public static StringContent SerializeObjectAsJsonBody<T>(T body)
    {
        return GetJsonContent(JsonSerializer.Serialize(body));
    }
}