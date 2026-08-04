function UpdateDictionaries($sourceDictionaryPath, $destinationDictionaryPath) {
    $stopWatch = [System.Diagnostics.Stopwatch]::StartNew()
    $db = 'master:'

    $sourceDictionary = Get-Item -Path ($db + $sourceDictionaryPath) -ErrorAction SilentlyContinue
    if ($sourceDictionary -ne $null) {

        $destinationDictionary = Get-Item -Path ($db + $destinationDictionaryPath) -ErrorAction SilentlyContinue
        if ($destinationDictionary -ne $null) {
            $sourceDictionaryItems = Get-ChildItem -Path ($db + $sourceDictionary.ItemPath) -Recurse -ErrorAction SilentlyContinue
            $destinationDictionaryItems = Get-ChildItem -Path ($db + $destinationDictionary.ItemPath) -Recurse -ErrorAction SilentlyContinue
            $sourceItemPaths = BuildItemPathHashTable $sourceDictionaryItems
            $destinationItemPaths = BuildItemPathHashTable $destinationDictionaryItems

            RemoveObsoleteDictionaryitems $db $sourceDictionaryPath $destinationDictionaryPath $sourceItemPaths $destinationDictionaryItems

            AddNewDictionaryitems $db $sourceDictionaryPath $destinationDictionaryPath $destinationItemPaths $sourceDictionaryItems

        } else {
            Write-Host 'Error: Destination dictionary not found.' -ForegroundColor Red
        }
    } else {
        Write-Host 'Error: Source dictionary not found.' -ForegroundColor Red
    }

    $stopWatch.Stop()
    Write-Host 'Info: Total elapsed time -' $stopWatch.Elapsed  -ForegroundColor Green
}

function BuildItemPathHashTable($items) {
    $hashTable = @{}
    foreach ($item in $items) {
        $hashTable[$item.ItemPath.ToLower()] = $item
    }

    return $hashTable
}

function RemoveObsoleteDictionaryitems($db, $sourceDictionaryPath, $destinationDictionaryPath, $sourceItemPaths, $destinationDictionaryItems) {
    $count = 0
    foreach ($destinationItem in $destinationDictionaryItems) {
        $sourceItemPathSuffix = $destinationItem.ItemPath -ireplace [regex]::Escape($destinationDictionaryPath), '' # case insensitive string replace
    	$sourceItemPath = $sourceDictionaryPath + $sourceItemPathSuffix
    	
        if (-not $sourceItemPaths.ContainsKey($sourceItemPath)) {
            $destinationItem | Remove-Item -Recurse -ErrorAction SilentlyContinue | Out-Null
            $count++
        }
    }
    
    Write-Host $count ' obsolete dictionary items removed.'
}

function AddNewDictionaryitems($db, $sourceDictionaryPath, $destinationDictionaryPath, $destinationItemPaths, $sourceDictionaryItems) {
    $count = 0
    foreach ($sourceItem in $sourceDictionaryItems) {
        $destinationItemPathSuffix = $sourceItem.ItemPath -ireplace [regex]::Escape($sourceDictionaryPath), '' # case insensitive string replace
    	$destinationItemPath = $destinationDictionaryPath + $destinationItemPathSuffix

        if (-not $destinationItemPaths.ContainsKey($destinationItemPath)) {
            Copy-Item -Path ($db + $sourceItem.ItemPath) -Destination ($db + $destinationItemPath) -ErrorAction SilentlyContinue | Out-Null
            $count++
        }
    }
    Write-Host $count ' dictionary items added.'
}

Write-Host 'Updating Holidays Dictionary...'   -ForegroundColor Green
$sourceDictionaryPath = "/sitecore/templates/Branches/Project/Holidays/Website/$" + "name/Dictionary Domain"
$destinationDictionaryPath = "/sitecore/content/EasyJet/Holidays/Dictionary"
UpdateDictionaries $sourceDictionaryPath $destinationDictionaryPath

Write-Host ' '
Write-Host 'Updating Trade Portal Dictionary...'   -ForegroundColor Green
$sourceDictionaryPath = "/sitecore/templates/Branches/Project/Trade Portal/Website/$" + "name/Dictionary"
$destinationDictionaryPath = "/sitecore/content/EasyJet/TradePortal/Dictionary"
UpdateDictionaries $sourceDictionaryPath $destinationDictionaryPath