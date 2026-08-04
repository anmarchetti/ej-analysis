USE [sc.holidays_Xdb.Collection.Shard0]
DECLARE @contactId uniqueidentifier ;  
DECLARE @ConcurrencyToken uniqueidentifier ;  
DECLARE @ContactIdentifier varbinary ;  
DECLARE @Counter INT 
DECLARE @LastModified DateTime2 
DECLARE @Today DateTime2 

Set @LastModified = DATEADD(month, -2, GetDate())
Set @Today = GetDate()
SET @Counter=1
WHILE ( @Counter <= 100000)
BEGIN
	SET @contactId = NEWID()  
	SET @ConcurrencyToken = NEWID()  
	set @ContactIdentifier=CONVERT(varbinary, newid())



	INSERT [xdb_collection].[Contacts] ([ContactId], [LastModified], [Created], [ConcurrencyToken], [Percentile], [ShardKey]) VALUES ( @contactId, @LastModified,  @Today, N'823240a3-4662-4818-8c7e-74b69431c57f', 0.72827346962773154, 0x38)

	INSERT [xdb_collection].[ContactFacets] ([ContactId], [FacetKey], [LastModified], [ConcurrencyToken], [FacetData], [ShardKey]) VALUES ( @contactId, N'ContactBehaviorProfile', @LastModified, @ConcurrencyToken, N'{"@odata.type":"#Sitecore.XConnect.Collection.Model.ContactBehaviorProfile","Scores":[]}', 0x38)

	INSERT [xdb_collection].[ContactFacets] ([ContactId], [FacetKey], [LastModified], [ConcurrencyToken], [FacetData], [ShardKey]) VALUES ( @contactId, N'EngagementMeasures', @LastModified, @ConcurrencyToken, N'{"@odata.type":"#Sitecore.XConnect.Collection.Model.EngagementMeasures","TotalInteractionCount":1,"MostRecentInteractionStartDateTime":"2023-02-28T08:23:55.5150658Z"}', 0x38)

	INSERT [xdb_collection].[ContactFacets] ([ContactId], [FacetKey], [LastModified], [ConcurrencyToken], [FacetData], [ShardKey]) VALUES ( @contactId, N'ExmKeyBehaviorCache', @LastModified, @ConcurrencyToken, N'{"@odata.type":"#Sitecore.EmailCampaign.Model.XConnect.Facets.ExmKeyBehaviorCache","UniqueEvents":null,"EmailsSent":null,"MarketingPreferences":null}', 0x38)

	INSERT [xdb_collection].[ContactFacets] ([ContactId], [FacetKey], [LastModified], [ConcurrencyToken], [FacetData], [ShardKey]) VALUES ( @contactId, N'InteractionsCache', @LastModified, @ConcurrencyToken, N'{"@odata.type":"#Sitecore.XConnect.Collection.Model.Cache.InteractionsCache","InteractionCaches":[],"DeviceVendorHardwareModels":[],"DeviceTypes":[],"DeviceVendors":[],"AreaCodes":[],"BusinessNames":[],"Cities":[],"Countries":[],"Dns":[],"Isps":[],"MetroCodes":[],"PostalCodes":[],"Regions":[],"Referrers":[],"SearchKeywords":[]}', 0x38)

	INSERT [xdb_collection].[ContactFacets] ([ContactId], [FacetKey], [LastModified], [ConcurrencyToken], [FacetData], [ShardKey]) VALUES ( @contactId, N'KeyBehaviorCache', @LastModified, @ConcurrencyToken, N'{"@odata.type":"#Sitecore.XConnect.Collection.Model.KeyBehaviorCache","Campaigns":[],"Channels":[],"CustomValues":[],"Goals":[],"Outcomes":[],"PageEvents":[],"Venues":[]}', 0x38)

	INSERT [xdb_collection].[ContactIdentifiers] ([ContactId], [Source], [Identifier], [IdentifierHash], [IdentifierType], [ShardKey]) VALUES ( @contactId, N'Alias', CONVERT(varbinary, newid()), CONVERT(varbinary, newid()), 0, 0x38)

	INSERT [xdb_collection].[ContactIdentifiers] ([ContactId], [Source], [Identifier], [IdentifierHash], [IdentifierType], [ShardKey]) VALUES ( @contactId, N'xDB', @ContactIdentifier, CONVERT(varbinary, newid()), 0, 0x38)

	INSERT [xdb_collection].[Interactions] ([InteractionId], [LastModified], [Created], [ConcurrencyToken], [ContactId], [StartDateTime], [EndDateTime], [Initiator], [DeviceProfileId], [ChannelId], [VenueId], [CampaignId], [Events], [UserAgent], [EngagementValue], [Percentile], [ShardKey]) VALUES (newid(), @LastModified, @Today, N'70c34745-23ca-49a2-a443-e1f142b01e64',  @contactId, @Today, @LastModified, 0, NULL, N'b418e4f2-1013-4b42-a053-b6d4dca988bf', NULL, NULL, N'[{"@odata.type":"#Sitecore.XConnect.Collection.Model.PageViewEvent","CustomValues":[],"DefinitionId":"9326cb1e-cec8-48f2-9a3e-91c7dbb2166c","ItemId":"456ab0be-0f85-433c-bf5d-2e7b3567b4ac","Id":"2cfe48d1-f0d7-4d8d-ac96-1d285e9e0b1b","Timestamp":"2023-02-28T08:23:55.5150658Z","ItemLanguage":"en-US","ItemVersion":1}]', N'web', 0, 0.061549189075336269, 0x38)

	INSERT [xdb_collection].[Interactions] ([InteractionId], [LastModified], [Created], [ConcurrencyToken], [ContactId], [StartDateTime], [EndDateTime], [Initiator], [DeviceProfileId], [ChannelId], [VenueId], [CampaignId], [Events], [UserAgent], [EngagementValue], [Percentile], [ShardKey]) VALUES (newid(), @LastModified, @Today, N'70c34745-23ca-49a2-a443-e1f142b01e64',  @contactId, @Today, @LastModified, 0, NULL, N'b418e4f2-1013-4b42-a053-b6d4dca988bf', NULL, NULL, N'[{"@odata.type":"#Sitecore.XConnect.Collection.Model.PageViewEvent","CustomValues":[],"DefinitionId":"9326cb1e-cec8-48f2-9a3e-91c7dbb2166c","ItemId":"456ab0be-0f85-433c-bf5d-2e7b3567b4ac","Id":"2cfe48d1-f0d7-4d8d-ac96-1d285e9e0b1b","Timestamp":"2023-02-28T08:23:55.5150658Z","ItemLanguage":"en-US","ItemVersion":1}]', N'web', 0, 0.061549189075336269, 0x38)

	INSERT [xdb_collection].[Interactions] ([InteractionId], [LastModified], [Created], [ConcurrencyToken], [ContactId], [StartDateTime], [EndDateTime], [Initiator], [DeviceProfileId], [ChannelId], [VenueId], [CampaignId], [Events], [UserAgent], [EngagementValue], [Percentile], [ShardKey]) VALUES (newid(), @LastModified,@Today, N'70c34745-23ca-49a2-a443-e1f142b01e64',  @contactId, @Today, @LastModified, 0, NULL, N'b418e4f2-1013-4b42-a053-b6d4dca988bf', NULL, NULL, N'[{"@odata.type":"#Sitecore.XConnect.Collection.Model.PageViewEvent","CustomValues":[],"DefinitionId":"9326cb1e-cec8-48f2-9a3e-91c7dbb2166c","ItemId":"456ab0be-0f85-433c-bf5d-2e7b3567b4ac","Id":"2cfe48d1-f0d7-4d8d-ac96-1d285e9e0b1b","Timestamp":"2023-02-28T08:23:55.5150658Z","ItemLanguage":"en-US","ItemVersion":1}]', N'web', 0, 0.061549189075336269, 0x38)

	INSERT [xdb_collection].[Interactions] ([InteractionId], [LastModified], [Created], [ConcurrencyToken], [ContactId], [StartDateTime], [EndDateTime], [Initiator], [DeviceProfileId], [ChannelId], [VenueId], [CampaignId], [Events], [UserAgent], [EngagementValue], [Percentile], [ShardKey]) VALUES (newid(), @LastModified, @Today, N'70c34745-23ca-49a2-a443-e1f142b01e64',  @contactId, @Today, @LastModified, 0, NULL, N'b418e4f2-1013-4b42-a053-b6d4dca988bf', NULL, NULL, N'[{"@odata.type":"#Sitecore.XConnect.Collection.Model.PageViewEvent","CustomValues":[],"DefinitionId":"9326cb1e-cec8-48f2-9a3e-91c7dbb2166c","ItemId":"456ab0be-0f85-433c-bf5d-2e7b3567b4ac","Id":"2cfe48d1-f0d7-4d8d-ac96-1d285e9e0b1b","Timestamp":"2023-02-28T08:23:55.5150658Z","ItemLanguage":"en-US","ItemVersion":1}]', N'web', 0, 0.061549189075336269, 0x38)

	INSERT [xdb_collection].[ContactIdentifiersIndex] ([Identifier], [IdentifierHash], [Source], [ContactId], [LockTime], [Version], [ShardKey]) VALUES (CONVERT(varbinary, newid()), CONVERT(varbinary, newid()), N'Alias', NEWID() , NULL, N'dc538d28-98d4-4c35-a0b2-eb56abb0e2e7', 0x42)

	INSERT [xdb_collection].[ContactIdentifiersIndex] ([Identifier], [IdentifierHash], [Source], [ContactId], [LockTime], [Version], [ShardKey]) VALUES (@ContactIdentifier, CONVERT(varbinary, newid()), N'xDB',  @contactId, NULL, N'dc538d28-98d4-4c35-a0b2-eb56abb0e2e7', 0x21)

	SET @Counter = @Counter +1 
END


