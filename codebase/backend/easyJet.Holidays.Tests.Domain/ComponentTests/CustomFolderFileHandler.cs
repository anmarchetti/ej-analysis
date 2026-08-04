using WireMock.Handlers;

namespace easyJet.Holidays.Tests.Domain.Integration;

/// <summary>
/// Filesystem handler for inserting into WireMock settings instead of default one.
/// assumes, that base path already ends with __admin/mappings, so all mappings would
/// be loaded from sub directory and it won't pick just all existing files every time.
/// see <see cref="LocalFileSystemHandler"/> for default settings
/// </summary>
public class CustomFolderFileSystemHandler : LocalFileSystemHandler
{
    private readonly string _basePath;
    private readonly string _adminMappingsFolder;
    private readonly string _unmatchedRequestsFolder;

    /// <param name="basePath">Base path to shared mappings folder, which ends with __admin/mappings</param>
    /// <param name="adminMappingsFolder">Particular folder under __admin/mappings to pick mappings from</param>
    /// <param name="unmatchedRequestsFolder">If you do not need specific folder - leave as is</param>
    public CustomFolderFileSystemHandler(string basePath, string adminMappingsFolder, string unmatchedRequestsFolder = "../../requests/unmatched")
    {
        // default guard clause to assure, everything is under default mappings path. if we decide to move mappings somewhere else - should be removed
        var ending = Path.Combine("__admin", "mappings");
        if (!basePath.EndsWith(ending))
        {
            throw new ArgumentException($"the mappings {nameof(basePath)} should end with {ending}, as this is the place, where we store static mappings by default");
        }
        _basePath = basePath;
        _adminMappingsFolder = adminMappingsFolder;
        _unmatchedRequestsFolder = unmatchedRequestsFolder;
    }

    public override string GetMappingFolder()
    {
        return Path.Combine(_basePath, _adminMappingsFolder);
    }

    public override string GetUnmatchedRequestsFolder()
    {
        return Path.Combine(_basePath, _unmatchedRequestsFolder);
    }
}