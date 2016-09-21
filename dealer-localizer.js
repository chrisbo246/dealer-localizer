/**
 * Update multi-shops dealer links according to the given country
 * E.g. Convert amazon.com to amazon.fr for French users
 * @module
 */
var dealerLocalizer = (function () {
    'use strict';

    var options = $.extend({
        var dataPath = './data/';
    }, window.dealerLocalizerOptions);

    var dealersData;
    var shopsData;
    var countriesData;
    var dataReady;


    var addURIParams = function ($link, newParams) {

       // Get URL parts
       var origin = $link.prop('origin');
       var pathname = $link.prop('pathname');
       var search = $link.prop('search');
       var hash = $link.prop('hash');

       // Parse URL params
       var params = $link.prop('search')
       .replace(/^\?/, '')
       .split('&')
       .reduce(function (params, param) {
          var pair = param.split('=').map(function (value) {
             return decodeURIComponent(value.replace('+', ' '));
          });
          params[pair[0]] = pair[1];
          return params;
       }, {});

       // Merge actual and new params
       var params = $.extend(params, newParams);

       // Combine URL components
       var url = origin + pathname + $.param(params) + hash;

       // Update link href
       $link.attr('href', url);

       console.log('Params updated', params);
       console.log('New URL', url);

    };



    /**
    * Try to detect the country code usin the freegeoip service
    * @return {String} The country code ISO2
    */
    var freegeoip = function () {

        $.ajax({
            url: '//freegeoip.net/json/',
            type: 'POST',
            dataType: 'jsonp',
            success: function(location) {
                console.log('Freegeoip.net geolocation returned', location);
            },
            error: function () {
                console.warn('Freegeoip.net geolocation failed');
            }
        });

    };



    /**
     * Save the link href and text in data attributs
     * @param {Object} $link Link element
     */
    var saveLink = function ($link) {

        if (!$link.data('default-href') || !$link.data('default-html')) {
            $link.attr('data-default-href', $link.attr('href'));
            $link.attr('data-default-html', $link.html());
        }

    };


    /**
     * Restore the link href and text from data attributs
     * @param {Object} $link Link element
     */
    var restoreLink = function ($link) {

        $link.attr('href', $link.data('default-href'));
        $link.html($link.data('default-html'));

    };



    /**
     * Update the link href and text
     * @param {Object} $link Link element
     * @param {String} href Link href attribut
     * @param {String} html Link text
     */
    var updateLink = function ($link, href, html) {

        $link.attr('href', href);
        $link.html(html);

    };



    /**
     * Check if the link href match one of the registred dealers
     * @param {Object} $link Link element
     * @return {Object} Regex atterns used to get associed shops
     */
    var getDealerData = function ($link) {

        var dealerData;

        $.each(dealersData, function (key, data) {
            if ($link.prop('href').match(new RegExp(data.pattern, 'g'))) {
                console.log('Dealer link found', $link.prop('href'), data);
                dealerData = data;
                return false;
            }
        });

        return dealerData;

    };



    /**
     * Generate link attributs for each local shop
     * @param {Object} $link Link element
     * @param {String} countryCode ISO2 country code upper case
     * @return {Array} The shops links (href / text attributs)
     */
    var getDealerLinks = function ($link, countryCode) {

        var list = {};
        var tld = $link.prop('hostname').match(/(\.[a-z]{2,3})?(\.[a-z]{2,3})$/g);

        // Check if the dealer have some local shops
        // and return the patterns allowing to find links
        var dealerData = getDealerData($link);
        if (dealerData) {

            // Get regex patterns for each local shops
            $.each(shopsData, function (host, shopData) {

                if (host.match(new RegExp(dealerData.hostSearchPattern, 'g'))) {
                    if (!countryCode || (shopData && (!shopData.countries || $.inArray(countryCode, shopData.countries) !== -1))) {

                        // Create a local URL using the given pattern
                        var url = $link.prop('href').replace(new RegExp($link.prop('hostname'), 'g'), host);
                        var url = url.replace(new RegExp(dealerData.urlSearchPattern, 'g'), dealerData.urlReplacePattern);

                        // Add affiliation parameters to query string
                        if (shopData.params) {
                            //url = url + (($link.prop('search')) ? '&' : '?') + shopData.queryString;
                            url = url + (($link.prop('search')) ? '&' : '?') + $.param(shopData.params);
                        }

                        list[host] = {
                            'href': url,
                            'html': host.replace(/^www\./g, '')
                            //'shipping_area_key': shippingAreaKey,
                            //'shipping_area_name': shippingAreaName,
                            //'filters': filters
                        };

                    }
                }

            });

        }

        return list;

    };



    /**
     * Update dealer links with the local shop URL
     * @param {String} linksSelector A selector matching dealer links
     * @param {String} countryCode ISO2 country code upper case
     */
    var localize = function (linksSelector, countryCode) {

        var $link, list;

        // Try to detect the country code if not defined
        var countryReady = new $.Deferred();
        if (countryCode) {
            countryReady.resolve();
        } else if (localStorage && localStorage.dealerLocalizerCountryCode) {
            countryCode = localStorage.dealerLocalizerCountryCode;
            countryReady.resolve();
        } else {
            freegeoip().done(function (location) {
                countryCode = location.country_code.toUpperCase();
                localStorage.dealerLocalizerCountryCode = countryCode;
                countryReady.resolve();
            });
        }

        //  Once required data has been loaded
        $.when(dataReady, countryReady).done(function () {

            $(linksSelector).each(function () {

                $link = $(this);

                // First save the link href and text in a data attribut
                saveLink($link);

                // Create a dataset for each local shop
                list = getDealerLinks($link, countryCode);
                if (list) {
                    $.each(list, function (host, data) {
                        updateLink($link, data.href, data.html);
                    });
                } else {
                    restoreLink($link);
                }

            });

        });

    };



    /**
    * Load JSON data
    */
    var loadData = function () {

        return $.when(
            $.getJSON(options.dataPath + 'dealers.json', function (json) {
                dealersData = json;
                console.log('Loaded', 'dealers.json');
            }),
            $.getJSON(options.dataPath + 'shops.json', function (json) {
                shopsData = json;
                console.log('Loaded', 'shops.json');
            })/*,
            $.getJSON(options.dataPath + 'countries.json', function (json) {
                countriesData = json;
                console.log('Loaded', 'countries.json');
            })*/
        );

    };



    // Load data ASAP
    dataReady = loadData();



    return {
        localize: localize
    }

})();
