$(document).ready(function () {
    /*
     * Constant variables
     */

    var $resultTypeSchema = $("input[name=search-result-type-schema]").val();
    var $resultTypeStartCompany = $("input[name=search-result-type-startcompany]").val();
    var $resultTypeInboxAdvertisement = $("input[name=search-result-type-inboxadvertisement]").val();
    var $resultTypeContextAdvertisement = $("input[name=search-result-type-contextadvertisement]").val();

    var $currentContext = $("input[name=search-current-context]").val();

    var $searchInboxUrl = $("input[name=search-inbox-url]").val();

    var $textClickHere = $("input[name=search-text-common-clickhere]").val();
    var $textIn = $("input[name=search-text-common-in]").val();

    var $textHits = $("input[name=search-text-hits]").val();
    var $textFor = $("input[name=search-text-for]").val();

    var $textAdvertisementToSearchFor = $("input[name=search-text-advertisements-tosearchfor]").val();
    var $textAdvertisementContextAllOtherHits = $("input[name=search-text-advertisements-context-allotherhits]").val();

    var $textAdvertisementInboxNotIncludedIntro = $("input[name=search-text-advertisements-inboxnotincluded-intro]").val();
    var $textAdvertisementInboxNotIncludedInYourInbox = $("input[name=search-text-advertisements-inboxnotincluded-inyourinbox]").val();
    var $textAdvertisementInboxNotIncludedSearchFor = $("input[name=search-text-advertisements-inboxnotincluded-searchfor]").val();
    var $textAdvertisementInboxNotIncludedInTheInbox = $("input[name=search-text-advertisements-inboxnotincluded-intheinbox]").val();

    var $language = $("html").attr('lang');


    /*
     * Gets the argument value of a URL parameter
     */
    var $getUrlParameter = function ($name) {
        var results = new RegExp('[\?&]' + $name + '=([^&#]*)').exec(window.location.href);

        if (results) {
            return results[1] || 0;
        }

        return 0;
    };

    /*
     * Sets focus to the active context on page load. This will help users who navigate between
     * contexts by using the keyboard (don't have to start over after page reload).
     */
    if ($getUrlParameter("context")) {
        $("input[id=search-ctx-" + $getUrlParameter("context") + "]").focus();
    }

    var $query = decodeURIComponent($getUrlParameter('q'));
    var $take = 10;
    var $page = 1;

    /*
    * Highlights search query
    */
    var $highlightSearchQuery = function () {
        var $context = $(".a-searchResults");

        var $options = {
            "element": "span",
            "className": "a-searchSelected",
            "exclude": [".ignore-highlight"]
        };

        $($context).unmark({
            done: function () {
                $($context).mark($query, $options);
            }
        });
    };

    /*
    * Listen for changes to context / button clicks
    */
    $("input[id^=search-ctx]").click(function () {
        var $url = "?query=" + encodeURIComponent($query);
        var $context = $(this).attr('id').split("-")[2];

        if (!$(this).attr('checked')) {
            $url += "&context=" + encodeURIComponent($context);
        }

        window.location.href = $url;
    });

    var $createGoToUrl = function ($contentGuid, $isFallbackLanguage, $hitId, $trackId) {
        var url = "/" + $language + "/goto/" + $contentGuid + "?query=" + encodeURIComponent($query);

        if ($isFallbackLanguage) {
            url += "&fallback=" + $isFallbackLanguage;
        }

        if ($hitId) {
            url += "&hitId=" + $hitId;
        }

        if ($trackId) {
            url += "&trackId=" + $trackId;
        }

        return url;
    };

    /*
     * Creates HTML for a schema
     */
    var $createSchemaHtml = function ($schema, $showScore) {
        var $html =
            "<div class='row " + ($schema.hidePaddingTop || $schema.isCard ? "" : "pt-2") + " " + ($schema.hideHorizontalLine ? "" : "a-borderBottomDark ") + ($schema.isCard ? "" : "mx-0") + "'>" +
            "<div class='col-sm-12 col-lg-12 pb-3 " + ($schema.isCard ? "" : "px-0") + "'>" +
            ($schema.isCard ? "<div class='a-iconText a-iconText-shadow a-iconText-background a-iconText-background--white'>" : "<div class='a-iconText a-iconText-background a-iconText-background--transparent'>") +
            "<div class='a-iconText-icon a-iconText-icon--start'><i class='ai ai-write a-icon' aria-hidden='true'></i></div>" +
            "<div class='a-iconText-text'>" +
            "<p class='a-iconText-text-small'>" + $schema.providerName + "</p>" +
            "<a href='" + $createGoToUrl($schema.contentGuid, $schema.isFallbackLanguage, $schema.hitId, $schema.trackId) + "' class='false'>" + $schema.title + ($showScore ? " (" + $schema.score + ")" : "") + "</a>" +
            ($schema.code != null ? " <span class='a-formCode'>" + $schema.code + "</span>" : "") + ($schema.isAttachment != null ? " <span class='badge badge-default a-label badge-pill ignore-highlight'>" + $schema.isAttachment + "</span>" : "") +
            ($schema.ingress != null ? "<p class='mt-1 mb-0 a-js-truncate-2'>" + $schema.ingress + "</p>" : "") +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>";

        return $html;
    };

    /*
     * Creates HTML for an article
     */
    var $createArticleHtml = function ($article, $showScore) {
        var $html =
            "<div class='row mx-0 pb-0 " + ($article.hidePaddingTop ? "" : "pt-2") + " " + ($article.hideHorizontalLine ? "" : "a-borderBottomDark") + "'>" +
            "<div class='col-sm-12 col-lg-10 offset-lg-1 px-0'>" +
            "<article class='a-linkArticle'>" +
            "<h2>" +
            "<a href='" + $createGoToUrl($article.contentGuid, $article.isFallbackLanguage, $article.hitId, $article.trackId) + "' class='a-link-title'>" + $article.title + ($showScore ? " (" + $article.score + ")" : "") + "</a>" +
            "<span class='badge badge-default a-label badge-pill ignore-highlight'>" + $article.tagName + "</span>" +
            "</h2>" +
            ($article.ingress ? "<p class='a-js-truncate-2'>" + $article.ingress + "</p>" : "") +
            "</article>" +
            "</div>" +
            "</div>";

        return $html;
    };

    /**
     * Creates HTML for inbox advertisement
     */
    var $createInboxAdvertisementHtml = function ($fullWidth) {
        var $html;

        var $card =
            "<img src='/Static/img/emailsok.svg' alt=''>" +
            "<div class='a-cardImage-text'>" +
            "<p class='ignore-highlight'>" + $textAdvertisementInboxNotIncludedIntro + ". <a href='" + $searchInboxUrl + "' class='ignore-highlight'>" + $textClickHere + "</a> " + $textAdvertisementToSearchFor + " <b class='ignore-highlight'>\"" + $query + "\"</b> " + $textAdvertisementInboxNotIncludedInYourInbox + ".</p>" +
            "</div>";

        if ($fullWidth) {
            $html =
                "<div class='row'>" +
                "<div class='col-sm-12 col-lg-12 pb-0'>" +
                "<div class='a-card a-cardImage a-cardImage-border a-cardImage-largePadding'>" + $card + "</div>" +
                "</div>" +
                "</div>";
        } else {
            $html =
                "<div class='col-sm-12 col-lg-6 pt-3 pt-lg-0'>" +
                "<h2 class='ignore-highlight'>" + $textAdvertisementInboxNotIncludedSearchFor + " <b class='ignore-highlight'>'" + $query + "'</b> " + $textAdvertisementInboxNotIncludedInTheInbox + ":</h2>" +
                "<div class='a-card a-cardImage a-cardImage-border'>" + $card + "</div>" +
                "</div>";
        }

        return $html;
    };

    /*
     * Creates HTML for context advertisement
     */
    var $createContextAdvertisementHtml = function ($advertisement) {
        var $html =
            "<div class='col-sm-12 col-lg-6'>" +
            "<h2 class='ignore-highlight'>" + $advertisement.totalHits + " " + $textHits + " " + $textFor + " <b class='ignore-highlight'>'" + $query + "'</b> " + $textIn + " " + $advertisement.contextName + ":</h2>" +
            "<div class='a-list-container pr-md-2 pb-2'>" +
            "<ul class='a-list a-list-borderTopSolid a-list-noIcon'>";

        $($advertisement.advertisements).each(function ($i, $ad) {
            $html +=
                "<li class='a-dotted a-clickable a-list-hasRowLink'>" +
                "<a href='" + $createGoToUrl($ad.contentGuid, $ad.isFallbackLanguage) + "' class='a-list-rowLink'>" +
                "<div class='row'>" +
                "<div class='col ignore-highlight'>" + $ad.title + "</div>" +
                "</div>" +
                "</a>" +
                "</li>";
        });

        $html +=
            "</ul>" +
            "</div>" +
            "<a href='?query=" + $query + "&context=" + $advertisement.context + "' class='a-linkFeatured a-link-large ignore-highlight'>" + $textAdvertisementContextAllOtherHits + " " + $advertisement.contextName + " <i class='ai ai-sm ai-nw ai-nw-right ai-arrowright' aria-hidden='true'></i></a>" +
            "</div>";

        return $html;
    };

    /*
     * Appends search result to UI
     */
    var $appendSearchResult = function ($result) {
        var $html = "";

        if ($result.resultType === $resultTypeSchema) {
            $html = $createSchemaHtml($result, $getUrlParameter('score'));
        } else if ($result.resultType === $resultTypeStartCompany) {
            $html = $createArticleHtml($result, $getUrlParameter('score'));
        } else if ($result.resultType === $resultTypeInboxAdvertisement) {
            $html = $createInboxAdvertisementHtml(true);
        } else if ($result.resultType === $resultTypeContextAdvertisement) {
            console.log($result);
            if ($result.totalHits === 0) {
                $html += $createInboxAdvertisementHtml(true);
            } else {
                $html += "<div class='row py-3'>";
                $html += $createContextAdvertisementHtml($result);
                $html += $createInboxAdvertisementHtml(false);
                $html += "</div>";
            }
        }

        $($html).hide().appendTo($("#search-result-container")).show();
    };

    /*
     * This will clear the lastForm or lastArticle classes from a search result.
     * This can happen when the user clicks the load more button and the previously set
     * last form or article is no longer correct. 
     */
    var $clearLastFormOrArticle = function () {
        var $lastChild = document.getElementById("search-result-container").lastChild;

        var $lastResult = $($lastChild);

        if ($lastChild.className === "row") {
            // schema results has a container row, need to select its child
            $lastChild = $lastResult.children(":first").get(0);
            $lastResult = $($lastChild);
        }

        if ($lastResult.hasClass("a-searchResults-lastForm")) {
            $lastResult.removeClass("a-searchResults-lastForm");
        } else if ($lastResult.hasClass("a-searchResults-lastArticle")) {
            $lastResult.removeClass("a-searchResults-lastArticle");
        }
    };

    /*
    * Executes search request
    */
    var $executeSearch = function ($url, $replace, $loadMore) {
        $.post($url, function ($data) {
            if ($replace) {
                $("#search-result-container").empty();
            }

            if (!$data.hasMore) {
                // no more results, hide button
                $("button[name=search-load-more-button]").hide();
            }

            if ($data.items.length && $loadMore) {
                $clearLastFormOrArticle();
            }

            $.each($data.items, function ($index, $result) {
                $appendSearchResult($result);
            });

            setupTruncateLines(); // external call

            
        });
    };

    var $fetchSummary = async function ($url) {
        try {
            $('.search-summary-loader').html('<div class="loader loader-ellipsis"></div>');

            const response = await $.get($url);

            if (response.summary) {
                const referencedIndices = new Set();

                const summaryContent = response.summary
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\\n\\n/g, '</p><p>')
                    .replace(/\\n/g, '</p><p>')
                    .replace(/(?<!\n)\n(?!\n)/g, '<br/>')
                    .replace(/\[(\d+)\]/g, (match, index) => {
                        referencedIndices.add(index);
                        const ref = response.references.find(ref => ref.index == index);
                        return ref && match;
                    });

                $('#search-summary').html(`<p>${summaryContent}</p>`);

                let referenceList = '<ul class="search-summary-references">';
                response.references
                    .filter(ref => referencedIndices.has(String(ref.index)))
                    .forEach(ref => {
                        referenceList += `
                        <li>
                            [${ref.index}] <a href="${ref.url}">${ref.title}</a>
                        </li>
                    `;
                    });
                referenceList += '</ul>';

                $('#search-summary').append(referenceList);
                $('#search-summary-no-results-container').hide();
                $('#search-summary-container').show();
            } else {
                $('#search-summary-container').hide();
                $('#search-summary-no-results-container').show();
            }
        } catch (error) {
            console.error('Error', error);
        } finally {
            $('.search-summary-loader').empty();
        }
    };

    /*
     * Builds a search query param string
     */
    var $buildSearchUrl = function () {
        return "/" + $language + "/search/" + $currentContext + "/" + ($page - 1) * $take + "/" + $take + "?query=" + encodeURIComponent($query);
    };

    var $buildSummaryUrl = function () {
        return "/getSearchSummary" + "?query=" + encodeURIComponent($query) + "&language=" + $language;
    };


    /*
    * Listen for clicks on the load more button
    */
    $("button[name=search-load-more-button]").click(function () {
        $page++;
        $executeSearch($buildSearchUrl(true), false, true);
    });

    $executeSearch($buildSearchUrl(), false, false);

});