var $J = jQuery.noConflict();

$J(document).ready(function () {
    var $coordinateslegendText = "Current Focal Point For ";
    var $devices = $J('#Devices');
    var $devicesOptions = $J('#Devices option');
    var $selectedViewCooredinates = $J("#DesktopViewCoordinates");
    var $imageFrame = $J('#ImageFrame');
    var $indicator = $J('#indicator');

    var $updateIndicator = function () {
        var points = $selectedViewCooredinates.val().split(', ');
        var left = points[0];
        var top = points[1];
        $indicator.css("left", left + "%").css("top", top + "%");
    }
    var $hideAllCoorinatesTextBoxes = function () {
        $devicesOptions.each(function () {
            var textBoxId = "#" + $J(this).val();
            $J(textBoxId).hide();
        });
    }

    var $updateLegend = function () {
        var device = $devices.find(":selected").text();
        $J("#coordinateslegend").text($coordinateslegendText + device);
    }

    var $setIndicator = function() {
        if ($selectedViewCooredinates.val().length === 0) {
            $indicator.hide();
        }
        else {
            $updateIndicator();
        }
    }


    $updateLegend();
    $setIndicator();

    $devices.on('change', function () {
        $hideAllCoorinatesTextBoxes();
        var selectedId = "#" + $J(this).val();
        $selectedViewCooredinates = $J(selectedId);
        $updateLegend();
        $selectedViewCooredinates.show();
        $setIndicator();
    });

    $imageFrame.click(function (e) {
        var offset = $imageFrame.offset();
        var relativeX = e.pageX - offset.left;
        var relativeY = e.pageY - offset.top;

        var width = $imageFrame.width();
        var height = $imageFrame.height();

        var percentageLeft = Math.round(relativeX * 100 / width);
        var percentageTop = Math.round(relativeY * 100 / height);

        $selectedViewCooredinates.val(percentageLeft + ", " + percentageTop);
        $setIndicator();
    });
});