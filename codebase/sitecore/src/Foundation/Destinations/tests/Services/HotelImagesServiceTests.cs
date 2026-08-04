using System;
using System.Collections.Generic;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class HotelImagesServiceTests
    {
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDestinationsLogger logger;
        private readonly HotelImagesService service;

        public HotelImagesServiceTests()
        {
            datasourceRepository = Substitute.For<IDatasourceRepository>();
            logger = Substitute.For<IDestinationsLogger>();

            service = new HotelImagesService(datasourceRepository, logger);
        }

        [Fact]
        public void Create_ShouldThrowArgumentNullException_WhenParentItemIsNull()
        {
            // Act
            Action act = () => service.Create(null, new List<string>());

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Create_ShouldSkip_WhenImageUrlsAreNull()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                service.Create(hotelItem, null);

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .CreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item), default(bool));
            }
        }

        [Fact]
        public void Create_ShouldSkip_WhenImageUrlsAreEmpty()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                service.Create(hotelItem, new List<string>());

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .CreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item), default(bool));
            }
        }

        [Fact]
        public void Create_ShouldCreateImagesFolderAndImages_WhenImageUrlsProvided()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Images, ID.NewID, Constants.TemplateIds.ImagesFolder)
                    {
                        new DbItem("024457a_hb_r_071", ID.NewID, Constants.TemplateIds.ExternalImage)
                        {
                            { Constants.Fields.DatasourceItem.Code, string.Empty },
                            { Constants.Fields.ExternalImageItem.Small, string.Empty },
                            { Constants.Fields.ExternalImageItem.Medium, string.Empty },
                            { Constants.Fields.ExternalImageItem.Large, string.Empty },
                            { Constants.Fields.StandardFields.SortOrder, string.Empty }
                        },
                        new DbItem("024457a_hb_r_072", ID.NewID, Constants.TemplateIds.ExternalImage)
                        {
                            { Constants.Fields.DatasourceItem.Code, string.Empty },
                            { Constants.Fields.ExternalImageItem.Small, string.Empty },
                            { Constants.Fields.ExternalImageItem.Medium, string.Empty },
                            { Constants.Fields.ExternalImageItem.Large, string.Empty },
                            { Constants.Fields.StandardFields.SortOrder, string.Empty }
                        }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var imagesFolder = db.GetItem("/sitecore/content/Hotel/Images");
                var imageOne = db.GetItem("/sitecore/content/Hotel/Images/024457a_hb_r_071");
                var imageTwo = db.GetItem("/sitecore/content/Hotel/Images/024457a_hb_r_072");

                var imageUrls = new List<string>
                {
                    "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_071.jpg",
                    "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_072.jpg"
                };

                datasourceRepository.GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Images,
                        Constants.TemplateIds.ImagesFolder)
                    .Returns(imagesFolder);

                datasourceRepository.GetOrCreateItem(
                        "024457a_hb_r_071",
                        Constants.TemplateIds.ExternalImage,
                        imagesFolder,
                        true)
                    .Returns(imageOne);

                datasourceRepository.GetOrCreateItem(
                        "024457a_hb_r_072",
                        Constants.TemplateIds.ExternalImage,
                        imagesFolder,
                        true)
                    .Returns(imageTwo);

                // Act
                service.Create(hotelItem, imageUrls);

                // Assert
                imageOne[Constants.Fields.ExternalImageItem.Large].Should().Be(imageUrls[0]);
                imageOne[Constants.Fields.StandardFields.SortOrder].Should().Be("10");

                imageTwo[Constants.Fields.ExternalImageItem.Large].Should().Be(imageUrls[1]);
                imageTwo[Constants.Fields.StandardFields.SortOrder].Should().Be("20");
            }
        }

        [Fact]
        public void AddMissing_ShouldThrowArgumentNullException_WhenHotelItemIsNull()
        {
            // Act
            Action act = () => service.AddMissing(null, new List<string>());

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void AddMissing_ShouldSkip_WhenImageUrlsAreNull()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                service.AddMissing(hotelItem, null);

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No valid image URLs found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void AddMissing_ShouldSkip_WhenImageUrlsAreEmpty()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                service.AddMissing(hotelItem, new List<string>());

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No valid image URLs found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void AddMissing_ShouldCreateOnlyMissingImage_WhenOneImageAlreadyExists()
        {
            // Arrange
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem(Constants.Fields.AccommodationItem.Images, ID.NewID, Constants.TemplateIds.ImagesFolder)
            {
                new DbItem("024457a_hb_r_071", ID.NewID, Constants.TemplateIds.ExternalImage)
                {
                    { Constants.Fields.ExternalImageItem.Large, "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_071.jpg" },
                    { Constants.Fields.StandardFields.SortOrder, string.Empty }
                }
            }
        },
        new DbItem("CreatedImages")
        {
            new DbItem("024457a_hb_r_072", ID.NewID, Constants.TemplateIds.ExternalImage)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty },
                { Constants.Fields.ExternalImageItem.Small, string.Empty },
                { Constants.Fields.ExternalImageItem.Medium, string.Empty },
                { Constants.Fields.ExternalImageItem.Large, string.Empty },
                { Constants.Fields.StandardFields.SortOrder, string.Empty }
            }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var imagesFolder = db.GetItem("/sitecore/content/Hotel/Images");
                var newImage = db.GetItem("/sitecore/content/CreatedImages/024457a_hb_r_072");

                var existingImageUrl = "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_071.jpg";
                var newImageUrl = "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_072.jpg";

                var imageUrls = new List<string>
        {
            existingImageUrl,
            newImageUrl
        };

                datasourceRepository.GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Images,
                        Constants.TemplateIds.ImagesFolder)
                    .Returns(imagesFolder);

                datasourceRepository.GetOrCreateItem(
                        "024457a_hb_r_072",
                        Constants.TemplateIds.ExternalImage,
                        imagesFolder,
                        true)
                    .Returns(newImage);

                // Act
                service.AddMissing(hotelItem, imageUrls);

                // Assert
                datasourceRepository.Received(1).GetOrCreateFolderItem(
                    hotelItem,
                    Constants.Fields.AccommodationItem.Images,
                    Constants.TemplateIds.ImagesFolder);

                datasourceRepository.DidNotReceive().GetOrCreateItem(
                    "024457a_hb_r_071",
                    Constants.TemplateIds.ExternalImage,
                    imagesFolder,
                    true);

                datasourceRepository.Received(1).GetOrCreateItem(
                    "024457a_hb_r_072",
                    Constants.TemplateIds.ExternalImage,
                    imagesFolder,
                    true);

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("already exists")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void ReplaceAll_ShouldThrowArgumentNullException_WhenParentItemIsNull()
        {
            // Act
            Action act = () => service.ReplaceAll(null, new List<string>());

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void ReplaceAll_ShouldSkip_WhenImageUrlsAreNull()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                service.ReplaceAll(hotelItem, null);

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No valid image URLs found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void ReplaceAll_ShouldSkip_WhenImageUrlsAreEmpty()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                service.ReplaceAll(hotelItem, new List<string>());

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No valid image URLs found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void ReplaceAll_ShouldCreateImages_WhenFolderHasNoExistingExternalImages()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Images, ID.NewID, Constants.TemplateIds.ImagesFolder)
                },
                new DbItem("CreatedImages")
                {
                    new DbItem("024457a_hb_r_091", ID.NewID, Constants.TemplateIds.ExternalImage)
                    {
                        { Constants.Fields.DatasourceItem.Code, string.Empty },
                        { Constants.Fields.ExternalImageItem.Small, string.Empty },
                        { Constants.Fields.ExternalImageItem.Medium, string.Empty },
                        { Constants.Fields.ExternalImageItem.Large, string.Empty },
                        { Constants.Fields.StandardFields.SortOrder, string.Empty }
                    }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var imagesFolder = db.GetItem("/sitecore/content/Hotel/Images");
                var newImage = db.GetItem("/sitecore/content/CreatedImages/024457a_hb_r_091");

                var imageUrl = "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_091.jpg";

                datasourceRepository.GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Images,
                        Constants.TemplateIds.ImagesFolder)
                    .Returns(imagesFolder);

                datasourceRepository.GetOrCreateItem(
                        "024457a_hb_r_091",
                        Constants.TemplateIds.ExternalImage,
                        imagesFolder,
                        true)
                    .Returns(newImage);

                // Act
                service.ReplaceAll(hotelItem, new List<string> { imageUrl });

                // Assert
                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No external images found")),
                    Arg.Any<object>());

                newImage[Constants.Fields.ExternalImageItem.Large].Should().Be(imageUrl);
                newImage[Constants.Fields.StandardFields.SortOrder].Should().Be("10");
            }
        }

        [Fact]
        public void ReplaceAll_ShouldRecycleExistingExternalImages_AndCreateNewImages()
        {
            // Arrange
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem(Constants.Fields.AccommodationItem.Images, ID.NewID, Constants.TemplateIds.ImagesFolder)
            {
                new DbItem("OldImage", ID.NewID, Constants.TemplateIds.ExternalImage)
                {
                    { Constants.Fields.ExternalImageItem.Large, "https://old-image.example/image.jpg" }
                }
            }
        },
        new DbItem("CreatedImages")
        {
            new DbItem("024457a_hb_r_101", ID.NewID, Constants.TemplateIds.ExternalImage)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty },
                { Constants.Fields.ExternalImageItem.Small, string.Empty },
                { Constants.Fields.ExternalImageItem.Medium, string.Empty },
                { Constants.Fields.ExternalImageItem.Large, string.Empty },
                { Constants.Fields.StandardFields.SortOrder, string.Empty }
            }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var imagesFolder = db.GetItem("/sitecore/content/Hotel/Images");
                var newImage = db.GetItem("/sitecore/content/CreatedImages/024457a_hb_r_101");

                var imageUrl = "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_101.jpg";

                datasourceRepository.GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Images,
                        Constants.TemplateIds.ImagesFolder)
                    .Returns(imagesFolder);

                datasourceRepository.GetOrCreateItem(
                        "024457a_hb_r_101",
                        Constants.TemplateIds.ExternalImage,
                        imagesFolder,
                        true)
                    .Returns(newImage);

                // Act
                service.ReplaceAll(hotelItem, new List<string> { imageUrl });

                // Assert
                datasourceRepository.Received(1).GetOrCreateFolderItem(
                    hotelItem,
                    Constants.Fields.AccommodationItem.Images,
                    Constants.TemplateIds.ImagesFolder);

                datasourceRepository.Received(1).GetOrCreateItem(
                    "024457a_hb_r_101",
                    Constants.TemplateIds.ExternalImage,
                    imagesFolder,
                    true);

                logger.DidNotReceive().Info(
                    Arg.Is<string>(x => x.Contains("No external images found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void AddMissing_ShouldNotThrow_WhenExistingImagesContainDuplicateUrls()
        {
            // Arrange
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem(Constants.Fields.AccommodationItem.Images, ID.NewID, Constants.TemplateIds.ImagesFolder)
            {
                new DbItem("ImageOne", ID.NewID, Constants.TemplateIds.ExternalImage)
                {
                    { Constants.Fields.ExternalImageItem.Large, "https://photos.hotelbeds.com/duplicate.jpg" },
                    { Constants.Fields.StandardFields.SortOrder, string.Empty }
                },
                new DbItem("ImageTwo", ID.NewID, Constants.TemplateIds.ExternalImage)
                {
                    { Constants.Fields.ExternalImageItem.Large, "https://photos.hotelbeds.com/duplicate.jpg" },
                    { Constants.Fields.StandardFields.SortOrder, string.Empty }
                }
            }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var imagesFolder = db.GetItem("/sitecore/content/Hotel/Images");

                datasourceRepository.GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Images,
                        Constants.TemplateIds.ImagesFolder)
                    .Returns(imagesFolder);

                // Act
                Action act = () => service.AddMissing(
                    hotelItem,
                    new List<string> { "https://photos.hotelbeds.com/duplicate.jpg" });

                // Assert
                act.Should().NotThrow();

                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .CreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item), default(bool));
            }
        }

        [Fact]
        public void Create_ShouldSkip_WhenImageUrlsContainOnlyEmptyValues()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                service.Create(hotelItem, new List<string> { null, string.Empty, "   " });

                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .CreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item), default(bool));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No valid image URLs found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void AddMissing_ShouldSkip_WhenImageUrlsContainOnlyEmptyValues()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                service.AddMissing(hotelItem, new List<string> { null, string.Empty, "   " });

                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No valid image URLs found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void ReplaceAll_ShouldSkip_WhenImageUrlsContainOnlyEmptyValues()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                service.ReplaceAll(hotelItem, new List<string> { null, string.Empty, "   " });

                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No valid image URLs found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Create_ShouldIgnoreEmptyImageUrls_AndCreateOnlyValidImages()
        {
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem(Constants.Fields.AccommodationItem.Images, ID.NewID, Constants.TemplateIds.ImagesFolder)
        },
        new DbItem("CreatedImages")
        {
            new DbItem("024457a_hb_r_071", ID.NewID, Constants.TemplateIds.ExternalImage)
            {
                { Constants.Fields.DatasourceItem.Code, string.Empty },
                { Constants.Fields.ExternalImageItem.Small, string.Empty },
                { Constants.Fields.ExternalImageItem.Medium, string.Empty },
                { Constants.Fields.ExternalImageItem.Large, string.Empty },
                { Constants.Fields.StandardFields.SortOrder, string.Empty }
            }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var imagesFolder = db.GetItem("/sitecore/content/Hotel/Images");
                var imageItem = db.GetItem("/sitecore/content/CreatedImages/024457a_hb_r_071");

                var validImageUrl = "https://photos.hotelbeds.com/giata/xl/02/024457/024457a_hb_r_071.jpg";

                datasourceRepository.GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Images,
                        Constants.TemplateIds.ImagesFolder)
                    .Returns(imagesFolder);

                datasourceRepository.GetOrCreateItem(
                        "024457a_hb_r_071",
                        Constants.TemplateIds.ExternalImage,
                        imagesFolder,
                        true)
                    .Returns(imageItem);

                service.Create(hotelItem, new List<string> { string.Empty, "   ", validImageUrl });

                datasourceRepository.Received(1).GetOrCreateItem(
                    "024457a_hb_r_071",
                    Constants.TemplateIds.ExternalImage,
                    imagesFolder,
                    true);

                imageItem[Constants.Fields.ExternalImageItem.Large].Should().Be(validImageUrl);
                imageItem[Constants.Fields.StandardFields.SortOrder].Should().Be("10");
            }
        }
    }
}