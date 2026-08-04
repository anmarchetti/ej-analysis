using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Data.Vouchers.Expiring;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using Voucherify.Core.DataModel;
using Voucherify.DataModel;
using Xunit;
using VCustomer = Voucherify.DataModel.Customer;
using VoucherType = easyJet.Holidays.Api.Domain.Data.Vouchers.VoucherType;
using VVoucherType = Voucherify.DataModel.VoucherType;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Vouchers
{
    public class ExpiringVouchersServiceTests
    {
        [Theory]
        [MemberData(nameof(VouchersData))]
        public async Task GetExpiringGroupedByCustomer_FilterVouchersWithoutHolderId(
            string because,
            List<VoucherWithCustomer> expiredVouchers,
            List<VCustomer> customers,
            Dictionary<string, ExpiringVouchersGroup> expected
        )
        {
            // Arrange
            var fixture = FixtureUtils.AutoMoqFixture();
            var expiringRepository = fixture.Freeze<Mock<IExpiringVouchersRepository>>();
            expiringRepository.Setup(x => x.GetAllExpiringVouchers(VoucherType.GIFT_VOUCHER, 10, true, It.IsAny<int>()))
                .ReturnsAsync(expiredVouchers);

            var customerRepository = fixture.Freeze<Mock<IVouchersCustomerRepository>>();
            customerRepository.Setup(x =>
                x.Get(It.Is<IEnumerable<string>>(id =>
                    id.SequenceEqual(customers.Select(c => c.Id))))).ReturnsAsync(customers);

            var sut = fixture.Freeze<ExpiringVouchersService>();

            // Act
            var actual = await sut.GetExpiringGroupedByCustomer(VoucherType.GIFT_VOUCHER, 10);

            // Assert
            actual.Should().BeEquivalentTo(expected, because);
        }

        private static VoucherWithCustomer BuildVoucher(string holderId, string code, int balance,
            DateTime expirationDate,
            bool active, Dictionary<string, object> metadata)
        {
            var gift = new Gift();
            gift.SetPrivateProperty("Balance", balance);

            var voucher = new VoucherWithCustomer();

            // It's properties with read-only get, have to use this "hack" to set value
            voucher.SetPrivateField("<Active>k__BackingField", active);
            voucher.SetPrivateField("<Gift>k__BackingField", gift);
            voucher.SetPrivateField("<Code>k__BackingField", code);
            voucher.SetPrivateField("<Type>k__BackingField", VVoucherType.GiftVoucher);
            voucher.SetPrivateField("<ExpirationDate>k__BackingField", expirationDate);
            voucher.SetPrivateField("<Metadata>k__BackingField", new Metadata(metadata));
            voucher.SetPrivateField("<Campaign>k__BackingField", "test campaign");
            voucher.SetPrivateField("<Category>k__BackingField", "test category");
            voucher.SetPrivateProperty("HolderId", holderId);

            return voucher;
        }

        private static VCustomer BuildCustomer(string id, string name, string email)
        {
            var customer = new VCustomer();
            customer.SetPrivateProperty("Id", id);
            customer.SetPrivateProperty("Name", name);
            customer.SetPrivateProperty("Email", email);

            return customer;
        }

        public static IEnumerable<object[]> VouchersData()
        {
            // Reason, ExpiringVouchers, Customers, Expected result
            var now = DateTime.Now;

            yield return new object[]
            {
                "Should ignore vouchers without customer or if customer does not exists",
                new List<VoucherWithCustomer>
                {
                    BuildVoucher("customer_1", "v_1", 12345, now, true, null),
                    BuildVoucher(null, "v_2", 6000, now, true, null),
                    BuildVoucher("customer_no_details", "v_3", 6000, now, true, null),
                },
                new List<VCustomer>()
                {
                    BuildCustomer("customer_1", "Joe Black", "joe@email.com"),
                    BuildCustomer("customer_no_details", null, null), // fake customer with invalid data
                },
                new Dictionary<string, ExpiringVouchersGroup>
                {
                    {
                        "customer_1",
                        new ExpiringVouchersGroup()
                        {
                            Customer = new VoucherCustomer() {Email = "joe@email.com", Name = "Joe Black"},
                            Vouchers = new List<ExpiringVoucher>()
                            {
                                new ExpiringVoucher()
                                {
                                    Code = "v_1",
                                    Balance = (decimal) 123.45,
                                    Campaign = "test campaign",
                                    Category = "test category",
                                    Type = "GiftVoucher",
                                    ExpirationDate = now,
                                    Metadata = new Dictionary<string, string>()
                                }
                            }
                        }
                    }
                }
            };
            yield return new object[]
            {
                "Should ignore vouchers with zero gift balance",
                new List<VoucherWithCustomer>
                {
                    BuildVoucher("customer_1", "v_1", 12345, now, true, null),
                    BuildVoucher("customer_2", "v_2", 0, now, true, null),
                },
                new List<VCustomer>()
                {
                    BuildCustomer("customer_1", "Joe Black", "joe@email.com"),
                },
                new Dictionary<string, ExpiringVouchersGroup>
                {
                    {
                        "customer_1",
                        new ExpiringVouchersGroup()
                        {
                            Customer = new VoucherCustomer() {Email = "joe@email.com", Name = "Joe Black"},
                            Vouchers = new List<ExpiringVoucher>()
                            {
                                new ExpiringVoucher()
                                {
                                    Code = "v_1",
                                    Balance = (decimal) 123.45,
                                    Campaign = "test campaign",
                                    Category = "test category",
                                    Type = "GiftVoucher",
                                    ExpirationDate = now,
                                    Metadata = new Dictionary<string, string>()
                                }
                            }
                        }
                    }
                }
            };

            yield return new object[]
            {
                "Should fill voucher & customer details",
                new List<VoucherWithCustomer>
                {
                    BuildVoucher("customer_exists", "v_1", 12345, now, true,
                        new Dictionary<string, object>() {{"booking_ref", "123"}, {"reason", "refund"}}),
                },
                new List<VCustomer>()
                {
                    BuildCustomer("customer_exists", "Joe Black", "joe@email.com"),
                },
                new Dictionary<string, ExpiringVouchersGroup>
                {
                    {
                        "customer_exists",
                        new ExpiringVouchersGroup()
                        {
                            Customer = new VoucherCustomer() {Email = "joe@email.com", Name = "Joe Black"},
                            Vouchers = new List<ExpiringVoucher>()
                            {
                                new ExpiringVoucher()
                                {
                                    Code = "v_1",
                                    Balance = (decimal) 123.45,
                                    Campaign = "test campaign",
                                    Category = "test category",
                                    Type = "GiftVoucher",
                                    ExpirationDate = now,
                                    Metadata = new Dictionary<string, string>()
                                        {{"booking_ref", "123"}, {"reason", "refund"}}
                                }
                            }
                        }
                    }
                }
            };
        }
    }
}