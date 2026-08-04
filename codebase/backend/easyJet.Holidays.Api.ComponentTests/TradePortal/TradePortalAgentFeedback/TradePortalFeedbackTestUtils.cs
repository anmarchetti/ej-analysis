namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalAgentFeedback;

internal class TradePortalFeedbackTestUtils
{
    private static readonly Dictionary<string, string> FormFieldValues = new()
    {
        ["Name"] = "John",
        ["TradeAgentName"] = "Bn",
        ["AbtaNumber"] = "123456",
        ["Email"] = "example@example.com",
        ["IsTradeFeedback"] = "true",
    };

    internal static void FillFormWithFields(MultipartFormDataContent form)
    {
        foreach (var (name, value) in FormFieldValues)
        {
            form.Add(new StringContent(value), name);
        }
    }

    internal static void ReplaceField(MultipartFormDataContent form, string fieldName, string value)
    {
        foreach (var (name, defaultValue) in FormFieldValues)
        {
            if (name == fieldName)
                continue;

            form.Add(new StringContent(defaultValue), name);
        }

        form.Add(new StringContent(value), fieldName);
    }
}