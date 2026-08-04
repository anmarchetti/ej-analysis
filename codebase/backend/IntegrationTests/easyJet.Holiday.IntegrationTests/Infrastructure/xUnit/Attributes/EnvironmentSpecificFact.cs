namespace easyJet.Holiday.IntegrationTests.Infrastructure.xUnit.Attributes;

/// <summary>
/// Fact, that would be ignored by the test runner, if the environment does not correspond to the list of chosen environments
/// </summary>
public class EnvironmentSpecificFact : FactAttribute
{
    /// <param name="environments">environments, where the test could be run</param>
    public EnvironmentSpecificFact(params string[] environments)
    {
        if (!environments.Contains(Environment.GetEnvironmentVariable(Constants.DotnetEnvironmentVariable)))
        {
            Skip = $"This test could only be run against next environments: {string.Join(", ", environments)}";
        }
    }
}