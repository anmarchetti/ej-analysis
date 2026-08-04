document.getElementById("ConfirmChangesCheckBox").addEventListener('change', function () {
    var publishToLiveButton = document.getElementById("PublishToLiveButton");

    publishToLiveButton.disabled = !this.checked;
});