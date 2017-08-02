$(function () {

    $(".my-checks-name").click(function() {
        $("#update-name-form").attr("action", this.dataset.url);
        $("#update-name-input").val(this.dataset.name);
        $("#update-tags-input").val(this.dataset.tags);
        $('#update-name-modal').modal("show");
        $("#update-name-input").focus();

        return false;
    });

    var MINUTE = {name: "minute", nsecs: 60};
    var HOUR = {name: "hour", nsecs: MINUTE.nsecs * 60};
    var DAY = {name: "day", nsecs: HOUR.nsecs * 24};
    var WEEK = {name: "week", nsecs: DAY.nsecs * 7};
    var MONTH = {name: "month", nsecs: DAY.nsecs * 30};
    var UNITS = [MONTH, WEEK, DAY, HOUR, MINUTE];

    var secsToText = function(total) {
        var remainingSeconds = Math.floor(total);
        var result = "";
        for (var i=0, unit; unit=UNITS[i]; i++) {
            if (unit === WEEK && remainingSeconds % unit.nsecs != 0) {
                // Say "8 days" instead of "1 week 1 day"
                continue
            }

            var count = Math.floor(remainingSeconds / unit.nsecs);
            remainingSeconds = remainingSeconds % unit.nsecs;

            if (count == 1) {
                result += "1 " + unit.name + " ";
            }

            if (count > 1) {
                result += count + " " + unit.name + "s ";
            }
        }

        return result;
    }

    var periodSlider = document.getElementById("period-slider");
    noUiSlider.create(periodSlider, {
        start: [20],
        connect: "lower",
        range: {
            'min': [60, 60],
            '11.11%': [1800, 1800],
            '22.22%': [3600, 3600],
            '33.33%': [43200, 43200],
            '44.44%': [86400, 86400],
            '55.55%': [604800, 604800],
            '66.66%': [2592000, 2592000],
            '77.77%': [3888000, 3888000],
            '88.88%': [5184000, 5184000],
            'max': 7776000,
        },
        pips: {
            mode: 'values',
            values: [60, 1800, 3600, 43200, 86400, 604800, 2592000, 3888000, 5184000, 7776000],
            density: 4,
            format: {
                to: secsToText,
                from: function() {}
            }
        }
    });

    periodSlider.noUiSlider.on("update", function(a, b, value) {
        var rounded = Math.round(value);
        $("#period-slider-value").text(secsToText(rounded));
        $("#update-timeout-timeout").val(rounded);
    });

    var graceSlider = document.getElementById("grace-slider");
    noUiSlider.create(graceSlider, {
        start: [20],
        connect: "lower",
        range: {
            'min': [60, 60],
            '11.11%': [1800, 1800],
            '22.22%': [3600, 3600],
            '33.33%': [43200, 43200],
            '44.44%': [86400, 86400],
            '55.55%': [604800, 604800],
            '66.66%': [2592000, 2592000],
            '77.77%': [3888000, 3888000],
            '88.88%': [5184000, 5184000],
            'max': 7776000,
        },
        pips: {
            mode: 'values',
            values: [60, 1800, 3600, 43200, 86400, 604800, 2592000, 3888000, 5184000, 7776000],
            density: 4,
            format: {
                to: secsToText,
                from: function() {}
            }
        }
    });

    graceSlider.noUiSlider.on("update", function(a, b, value) {
        var rounded = Math.round(value);
        $("#grace-slider-value").text(secsToText(rounded));
        $("#update-timeout-grace").val(rounded);
    });

    function showSimple() {
        $("#update-timeout-form").show();
        $("#update-cron-form").hide();
    }

    function showCron() {
        $("#update-timeout-form").hide();
        $("#update-cron-form").show();
    }

    var currentPreviewHash = "";
    function updateCronPreview() {
        var schedule = $("#schedule").val();
        var tz = $("#tz").val();
        var hash = schedule + tz;

        // Don't try preview with empty values, or if values have not changed
        if (!schedule || !tz || hash == currentPreviewHash)
            return;

        // OK, we're good
        currentPreviewHash = hash;
        $("#cron-preview-title").text("Updating...");
        $.post("/checks/cron_preview/", {schedule: schedule, tz: tz},
            function(data) {
                if (hash != currentPreviewHash) {
                    return;  // ignore stale results
                }

                $("#cron-preview" ).html(data);
                var haveError = $("#invalid-arguments").size() > 0;
                $("#update-cron-submit").prop("disabled", haveError);
            }
        );
    }

    $(".timeout-grace").click(function() {
        $("#update-timeout-form").attr("action", this.dataset.url);
        $("#update-cron-form").attr("action", this.dataset.url);

        // Simple
        periodSlider.noUiSlider.set(this.dataset.timeout);
        graceSlider.noUiSlider.set(this.dataset.grace);

        // Cron
        currentPreviewHash = "";
        $("#cron-preview").html("<p>Updating...</p>");
        $("#schedule").val(this.dataset.schedule);
        document.getElementById("tz").selectize.setValue(this.dataset.tz);
        var minutes = parseInt(this.dataset.grace / 60);
        $("#update-timeout-grace-cron").val(minutes);
        updateCronPreview();

        this.dataset.kind == "simple" ? showSimple() : showCron();
        $('#update-timeout-modal').modal({"show":true, "backdrop":"static"});
        return false;
    });

    // Wire up events for Timeout/Cron forms
    $(".kind-simple").click(showSimple);
    $(".kind-cron").click(showCron);

    $("#schedule").on("keyup", updateCronPreview);
    $("#tz").selectize({onChange: updateCronPreview});

    $(".check-menu-remove").click(function() {
        $("#remove-check-form").attr("action", this.dataset.url);
        $(".remove-check-name").text(this.dataset.name);
        $('#remove-check-modal').modal("show");

        return false;
    });


    $("#my-checks-tags button").click(function() {
        // .active has not been updated yet by bootstrap code,
        // so cannot use it
        $(this).toggleClass('checked');

        // Make a list of currently checked tags:
        var checked = [];
        $("#my-checks-tags button.checked").each(function(index, el) {
            checked.push(el.textContent);
        });

        // No checked tags: show all
        if (checked.length == 0) {
            $("#checks-table tr.checks-row").show();
            $("#checks-list > li").show();
            return;
        }

        function applyFilters(index, element) {
            var tags = $(".my-checks-name", element).data("tags").split(" ");
            for (var i=0, tag; tag=checked[i]; i++) {
                if (tags.indexOf(tag) == -1) {
                    $(element).hide();
                    return;
                }
            }

            $(element).show();
        }

        // Desktop: for each row, see if it needs to be shown or hidden
        $("#checks-table tr.checks-row").each(applyFilters);
        // Mobile: for each list item, see if it needs to be shown or hidden
        $("#checks-list > li").each(applyFilters);

    });

    $(".pause-check").click(function(e) {
        var url = e.target.getAttribute("data-url");
        $("#pause-form").attr("action", url).submit();
        return false;
    });

    $('[data-toggle="tooltip"]').tooltip();

    $(".usage-examples").click(function(e) {
        var a = e.target;
        var url = a.getAttribute("data-url");
        var email = a.getAttribute("data-email");

        $(".ex", "#show-usage-modal").text(url);
        $(".em", "#show-usage-modal").text(email);

        $("#show-usage-modal").modal("show");
        return false;
    });

    var clipboard = new Clipboard('button.copy-link');
    $("button.copy-link").mouseout(function(e) {
        setTimeout(function() {
            e.target.textContent = "copy";
        }, 300);
    })

    clipboard.on('success', function(e) {
        e.trigger.textContent = "copied!";
        e.clearSelection();
    });

    clipboard.on('error', function(e) {
        var text = e.trigger.getAttribute("data-clipboard-text");
        prompt("Press Ctrl+C to select:", text)
    });

    /*  Jobs table filter functionality */

    var select_filter = document.querySelector("#checks-filter");
    /* Listen for the change event on the select box. */
    select_filter.addEventListener("change", function(event){
        filterJobs(event.target.value);
    });

    function filterJobs(job_type){
        /* Store the checks-table element in the table variable. */
        var table = document.getElementById('checks-table');
        /* Set up standardized looping of rows in older versions of mozilla. */
        var rows = [].slice.call(table.querySelectorAll("tr.checks-row"));

        for (var i = 0; i < rows.length; i++) {
            var status = rows[i].dataset.status;
            /* Display all the jobs. */
            if(job_type === "all"){
                rows[i].style.display = "";
            }
            else{
                /* A match for the selection was found. Display the row. */
                if(job_type.indexOf(status) == 0){
                    rows[i].style.display = "";
                }
                else{
                    /* No match for the selection was found. Hide the row. */
                    rows[i].style.display = "none";
                }
          }
        }
    }
});
