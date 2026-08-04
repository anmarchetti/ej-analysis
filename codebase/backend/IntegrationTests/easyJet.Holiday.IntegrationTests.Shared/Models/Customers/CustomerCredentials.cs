namespace easyJet.Holiday.IntegrationTests.Shared.Models.Customers;

public class CustomerCredentials
{
    public required string Email { get; set; }

    public required string Password { get; set; }

    public bool RememberMe { get; set; }

    public string LoginCookie { get; set; } = string.Empty;
}