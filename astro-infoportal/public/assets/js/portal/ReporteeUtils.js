function SearchReportee() {
    var f = $("#reporteeForm");
    var url = f.attr("action");
    $("#ReporteeSearch_Block").val("0");
    var formData = f.serialize();
    if (!f.validate().checkForm()) {
        return;
    }
    $.post(url, formData, function (data) {
        $("#reporteeListContent").html(data);
        var showPersonal = $("#showpersonalreportee").val();
        var showProfileListHeading = $("#showprofileListHeading").val();
        if (showPersonal === 'True') {
            $("#reporteeSelfContainer").show();
        }
        else {
            $("#reporteeSelfContainer").hide();
        }
        if (showProfileListHeading === 'False') {
            $("#profileListHeading").hide();
        }
        else {
            $("#profileListHeading").show();

        }

        if (showProfileListHeading === 'False' && showPersonal === 'False') {
            $("#nosearchhitinfo").show();
        }
        else {
            $("#nosearchhitinfo").hide();
        }
    });
}

// Add subunit-toggle function for views without bootstrap
$('#nav-list').on('click', '.a-listWithSubLevels button.a-btn-shadow-expand', function (e) {
    e.preventDefault();
    e.stopPropagation();
    $($(this).data('target')).slideToggle(250);
});

$("#ReporteeSearch_SearchText").on('input', debounce(250, function () {
    SearchReportee();
}));

$("#ReporteeSearch_SearchText").on('keydown', function (e) {
    var key = e.which;
    if (key === 13) {
        e.preventDefault();
        SearchReportee();
    }
});

$("#ReporteeSearch_ShowAllSubUnits").on('click', debounce(250, function () {
    SearchReportee();
}));

$("#ReporteeSearch_IncludeInactiveReportees").on('click', debounce(250, function () {
    SearchReportee();
}));


var LoadMoreReportees = function () {
    var f = $("#reporteeForm");
    var url = f.attr("action");
    var loadMore = $("#reporteeListContent").find('.a-js-reporteelistLoadMore');
    var blockid = $("#reporteeListContent").find('#ReporteeSearch_Block');

    var formData = f.serialize();
    $.post(url, formData, function (data) {
        loadMore.remove();
        blockid.remove();
        $("#reporteeListContent").append(data);
    });

}

$('body').on('click', '.a-js-reporteelistLoadMore', function () {
    LoadMoreReportees();
});

function LoadReporteeHeader(targetUrl) {
    let headerUrl = window.altinn.hosturl + "/ui/Reportee/HeaderReporteeSelection?goTo=" + targetUrl;
    $.ajax({
        url: headerUrl,
        type: 'GET',
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            data = data.replaceAll("/ui/", window.altinn.hosturl + "/ui/");
            $("#reporteeheader").html(data);
        }
    })
}

$('body').on('input', '#ReporteeSearch_SearchTextHeader', debounce(250, function () {
    SearchReporteeHeader();
}));

function SearchReporteeHeader() {
    var f = $("#reporteeForm");
    var url =  window.altinn.hosturl + '/ui/Reportee/SearchHeader'
    var formData = f.serialize();
    if (!f.validate().checkForm()) {
        return;
    }
    $.post(url, formData, function (data) {
        $("#reporteeListContent").html(data);

        var reporteeCount = $("#ReporteeSearchResultCount").val();
        if (reporteeCount === '0') {
            $("#nosearchhitinfo").show();
        }
        else {
            $("#nosearchhitinfo").hide();
        }
    });
}

function debounce(wait, func, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}