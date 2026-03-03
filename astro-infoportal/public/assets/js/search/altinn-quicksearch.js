$(document).ready(function () {
    const MIN_CHARACTERS = 2;
    const DELAY = 300;
    let debounceTimer = null;
    const $enterKey = 13;
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function detectLanguageFromPath() {
        const path = window.location.pathname.toLowerCase();

        if (path.startsWith("/en/")) return "en";
        if (path.startsWith("/nn/")) return "nn";
        return "no";
    }

    const $search = function ($q, $isFooter) {
        let $query = $q.trim();
        if (!$query) return;

        $query = encodeURIComponent($query);

        const $baseUrl = $isFooter
            ? $("input[name=search-page-url-footer]").val()
            : $("input[name=search-page-url-body]").val();

        const $url = $baseUrl + "?q=" + $query;
        window.location.href = $url;
    };

    const $checkKeyPressForSearch = function ($key) {
        if ($key.which === $enterKey) {
            $search($(this).val(), false);
        }
    };

    const $inputs = $("input[name=search-input-field], input[name=search-input-field-mob], input[name=search-input-field-footer]");

    $inputs.keypress($checkKeyPressForSearch);

    $("button[name=search-button]").click(function () {
        $search($("input[name=search-input-field]").val(), false);
    });

    $("button[name=search-button-mob]").click(function () {
        $search($("input[name=search-input-field-mob]").val(), false);
    });

    $("button[name=search-button-footer]").click(function () {
        $search($("input[name=search-input-field-footer]").val(), true);
    });

    $inputs.on("input", function () {
        const $input = $(this);
        const query = $input.val().trim();

        clearTimeout(debounceTimer);

        if (query.length >= MIN_CHARACTERS) {
            debounceTimer = setTimeout(() => {
                fetchSuggestions(query, $input);
            }, DELAY);
        } else {
            removeSuggestions($input);
        }
    });

    const fetchSuggestions = function (query, $input) {
        const language = detectLanguageFromPath();
        $.post(`/${language}/api/suggestions?query=${encodeURIComponent(query)}`, function (response) {
            if (response && Array.isArray(response.suggestions)) {
                renderSuggestions(response.suggestions, response.suggestionsTitle, $input);
            } else {
                removeSuggestions($input);
            }
        });
    };

    const renderSuggestions = function (suggestions, suggestionsTitle, $input) {
        const $wrapper = $input.closest(".search-wrapper");
        $wrapper.find(".search-suggestions").remove();

        if (!suggestions || suggestions.length === 0) {
            return;
        }

        const query = $input.val().trim().toLowerCase();
        const $list = $("<ul class='search-suggestions'></ul>");
        const $header = $(`<li class='suggestion-header'>${suggestionsTitle}</li>`);
        $list.append($header);

        suggestions.forEach(item => {
            const title = item.title;
            let highlightedTitle = title;

            if (query.length > 0) {
                const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
                highlightedTitle = title.replace(regex, "<mark>$1</mark>");
            }

            const $li = $("<li></li>");
            const $a = $("<a></a>")
                .attr("href", item.url)
                .addClass("suggestion-link")
                .html(highlightedTitle);

            $li.append($a);
            $list.append($li);
        });

        $wrapper.append($list);
    };

    const removeSuggestions = function ($input) {
        $input.closest(".search-wrapper").find(".search-suggestions").remove();
    };

});