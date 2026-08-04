namespace easyJet.Holidays.IntegrationTests.TestApi.Attributes;

public class CreationParameterAttribute : Attribute
{
    public string ParameterName { get; set; }

    public CreationParameterAttribute(string parameterName)
    {
        ParameterName = parameterName;
    }
}