

DECLARE @BatchSize        INT = 100000
DECLARE @DeadLine        DateTime2 = DATEADD(month, -1, GetDate())
DECLARE @CountContactsToKeep INT  
DECLARE @CountContactsRemaining INT  

SELECT @CountContactsToKeep=COUNT(*)
  FROM [xdb_collection].[ContactIdentifiers]
  where Source = 'pushnotifications'

PRINT 'Before cleanup we have ' + CAST(@CountContactsToKeep AS CHAR(30))+ ' contacts we want to keep'


PRINT 'Copy considered contacts to local variable...' 

SELECT  c.ContactId INTO #TempContacts FROM [xdb_collection].[Contacts] c 
WHERE Not EXISTS 
(
	SELECT contactId FROM [xdb_collection].[Interactions] i where
	i.ContactId = c.ContactId and
	i.EndDateTime > @DeadLine
) 
and NOT Exists 
(
	SELECT contactId
	FROM [xdb_collection].[ContactIdentifiers] ci
	WHERE IdentifierType = 1 and ci.ContactId = c.ContactId 
)
PRINT 'Clearing Data...' 
WHILE 1=1
BEGIN
	IF EXISTS (select contactId from #TempContacts) 
		BEGIN

			DELETE FROM [xdb_collection].[ContactFacets] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)

			DELETE FROM [xdb_collection].[ContactIdentifiersIndex] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)

			DELETE FROM [xdb_collection].[InteractionFacets] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)

			DELETE FROM [xdb_collection].[Interactions] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)

			DELETE FROM [xdb_collection].[ContactIdentifiers] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)

			DELETE FROM [xdb_collection].[Contacts] WHERE ContactId IN (SELECT top (@BatchSize) contactId FROM #TempContacts)
 
			DELETE FROM [xdb_collection].[DeviceProfiles] WHERE LastKnownContactId IN (select top (@BatchSize) contactId from #TempContacts)

			DELETE top (@BatchSize) FROM #TempContacts

		END
	ELSE
		BEGIN
			PRINT 'Clearing finished...' 
			Drop Table #TempContacts
			BREAK;
		END
END
SELECT @CountContactsRemaining=COUNT(*)
  FROM [xdb_collection].[ContactIdentifiers]
  where Source = 'pushnotifications'

PRINT 'After cleanup we have ' + CAST(@CountContactsRemaining AS CHAR(30))+ ' contacts we want to keep: '+ CAST(@CountContactsToKeep AS CHAR(30))

PRINT 'Rebuilding fragmented indexes now'

ALTER INDEX [IX_ContactIdentifiers_Identifier_Unique] ON [xdb_collection].[ContactIdentifiers] REBUILD 
ALTER INDEX [PK_ContactIdentifiersIndex] ON [xdb_collection].[ContactIdentifiersIndex] REBUILD 
ALTER INDEX [PK_DeviceProfiles] ON [xdb_collection].[DeviceProfiles] REBUILD 
ALTER INDEX [IX_Interactions_ContactId_StartDateTime] ON [xdb_collection].[Interactions] REBUILD 
ALTER INDEX [PK_ContactFacets] ON [xdb_collection].[ContactFacets] REBUILD 
ALTER INDEX [PK_ContactIdentifiers] ON [xdb_collection].[ContactIdentifiers] REBUILD 
ALTER INDEX [IX_Interactions_StartDateTime_Created_InteractionId] ON [xdb_collection].[Interactions] REBUILD 
ALTER INDEX [PK_InteractionFacets] ON [xdb_collection].[InteractionFacets] REBUILD 
ALTER INDEX [PK_Contacts] ON [xdb_collection].[Contacts] REBUILD 
ALTER INDEX [IX_Contacts_Created_ContactId] ON [xdb_collection].[Contacts] REBUILD 
ALTER INDEX [PK_Interactions] ON [xdb_collection].[Interactions] REBUILD 


PRINT 'Cleanup finished successfully!'


