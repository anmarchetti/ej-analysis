using easyJet.Holidays.Api.Domain.Data.Authentication;

namespace easyJet.Holidays.Api.Domain.Services.Authentication;

internal sealed class CustomerIdentifierProvider(IAuthenticationService authenticationService)
    : ICustomerIdentifierProvider
{
    public async Task<CustomerIdentifiers> CustomerIdentifiers()
    {
        var customerDetails = await authenticationService.CustomerDetails();
        var mappedCustomerId = await authenticationService.MappedCustomerId(customerDetails);

        return new CustomerIdentifiers { Id = customerDetails?.Id, MappedId = mappedCustomerId, };
    }
}