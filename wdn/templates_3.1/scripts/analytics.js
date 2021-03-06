// What should be tracked in Google Analytics
// 
// 1. File downloads: .pdf, .doc., etc... put in the /downloads directory DONE
// 2. Social media share uses: track the clicks. Use event tracking DONE
// 3. External links: track links to outside the domain? put in /external directory DONE
// 4. Video usage tracking by default. Should be incorporated with the skin/video JS file
// 5. Navigation preferences. Which view is being used? Use event tracking DONE
// 6. Usage of the wdn_tools. Use event tracking DONE
// 7. Tab content. Use event tracking? Set up a way for departments to take advantage of this tracking?
// 
// WDN.analytics.callTrackEvent(category, action, optional_label, optional_value)
// WDN.analytics.callTrackPageview('/downloads/'+href);
//
// Department variable 'pageTracker' is available to use in this file.

WDN.analytics = function() {
	var initd = {
		'desktop': false,
		'mobile': false
	};
	return {
		thisURL : String(window.location), //the current page the user is on.
		rated : false, // whether the user has rated the current page.
		initialize : function() {
			var widthScript = WDN.getCurrentWidthScript(), isMobile = widthScript == '320';
			WDN.log("WDN site analytics loaded for "+ WDN.analytics.thisURL) ;

            var version_html = WDN.getHTMLVersion(),
                version_dep  = WDN.getDepVersion(),
                ga_linkattribution_pluginURL = '//www.google-analytics.com/plugins/ga/inpage_linkid.js';

			_gaq.push(
				['wdn._setAccount', 'UA-3203435-1'],
				['wdn._setDomainName', '.unl.edu'],
				['wdn._setCustomVar', 2, 'Template HTML Version', version_html, 3],
				['wdn._setCustomVar', 3, 'Template Dependents Version', version_dep, 3],
				['wdn._setAllowLinker', true],
				['wdn._require', 'inpage_linkid', ga_linkattribution_pluginURL]
			);

			if (isMobile) {
				_gaq.push(
					['m._setAccount', 'UA-3203435-4'],
					['m._setDomainName', '.unl.edu'],
					['m._setCustomVar', 2, 'Template HTML Version', version_html, 3],
					['m._setCustomVar', 3, 'Template Dependents Version', version_dep, 3],
					['m._setAllowLinker', true],
					['m._require', 'inpage_linkid', ga_linkattribution_pluginURL]
				);
			}

			if (!initd['desktop'] && !initd['mobile']) {
				WDN.loadJS(WDN.getTemplateFilePath('scripts/idm.js'), function(){
					WDN.idm.initialize(function() {
						WDN.analytics.loadGA(isMobile);
					});
				});
			}

			if (!isMobile && !initd['desktop']) {
				/* At >768, we bring in .socialmedia and #wdn_toollinks and .rating, so keep using jQuery for these. */
				WDN.jQuery('.socialmedia .outpost a').click(function(){ 
					var socialMedia = WDN.jQuery(this).parent().attr('id');
					socialMedia = socialMedia.replace(/wdn_/gi, '');
					//WDN.analytics.callTrackEvent('Page Sharing', socialMedia, WDN.analytics.thisURL);
					_gaq.push(['wdn._trackSocial', socialMedia, 'share']);
					try {
						if (WDN.analytics.isDefaultTrackerReady()) {
							_gaq.push(['_trackSocial', socialMedia, 'share']);
						} else {
							throw "Default Tracker Account Not Set";
						}
					} catch(e) {
						WDN.log("Social Media tracking for local site didn't work.");
					}
				});
				WDN.jQuery('#wdn_tool_links a').click(function(){ 
					var wdnToolLinks = WDN.jQuery(this).text();
					WDN.analytics.callTrackEvent('WDN Tool Links', wdnToolLinks, WDN.analytics.thisURL);
				});
				WDN.jQuery('div.rating div.star a').click(function(){ 
					if (!WDN.analytics.rated)
					{
						WDN.analytics.rated = true;
						var value = WDN.jQuery(this).text();
						WDN.analytics.callTrackEvent('Page Rating', 'Rated a '+value, WDN.analytics.thisURL, value);
					}
				});
				
				initd['desktop'] = true;
			} else {
				initd['mobile'] = true;
			}
			
			WDN.analytics.bindLinks();
		},
		
		bindLinks : function() {
            WDN.log('Begin binding links for analytics');
            //get the links in the navigation and maincontent
            var nav = document.getElementById('navigation'), navLinks = nav.getElementsByTagName("a"), main = document.getElementById('maincontent'), mainLinks = main.getElementsByTagName("a"), evaluateLinks, filetypes = /\.(zip|exe|pdf|doc*|xls*|ppt*|mp3|m4v|mov|mp4)$/i;
            
            evaluateLinks = function(link) {
                var gahref = link.getAttribute("href");
                if (!gahref) {
                    return;
                }

                function bindEvent(el, eventName, eventHandler) {
                    if (el.addEventListener){
                        el.addEventListener(eventName, eventHandler, false); 
                    } else if (el.attachEvent){
                        el.attachEvent('on'+eventName, eventHandler);
                    }
                }
 
                if ((gahref.match(/^https?\:/i)) && (!gahref.match(document.domain))){
                    bindEvent(link, 'click', function() {
                        WDN.analytics.callTrackEvent('Outgoing Link', gahref, WDN.analytics.thisURL);
                        WDN.analytics.callTrackPageview(gahref, false);
                    });
                } else if (gahref.match(/^mailto\:/i)){
                    var mailLink = gahref.replace(/^mailto\:/i, '');  
                    bindEvent(link, 'click', function() {
                        WDN.analytics.callTrackEvent('Email', mailLink, WDN.analytics.thisURL);
                    });
                } else if (gahref.match(filetypes)){
                    var extension = (/[.]/.exec(gahref)) ? /[^.]+$/.exec(gahref) : undefined;
                    bindEvent(link, 'click', function() {
                        WDN.analytics.callTrackEvent('File Download', gahref, WDN.analytics.thisURL);
                        WDN.analytics.callTrackPageview(gahref);
                    });
                }
            }

            //loop through all the links and pass them to type evaluation
            for (var i=0; i<navLinks.length; i++) {
                evaluateLinks(navLinks[i]);
            }
            
            for (var j=0; j<mainLinks.length; j++) {
                evaluateLinks(mainLinks[j]);
            }
		},
		
		loadGA : function(mobile){
			_gaq.push(['wdn._trackPageview']);
			
			if (mobile) {
				_gaq.push(['m._trackPageview']);
			}
			
			(function(){
				var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
				if (document.body.className.match(/(^|\s)debug(\s|$)/)) {
					ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/u/ga_debug.js';
				} else {
					ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
				}
				var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
			})();
		},
		
		trackNavigationPreferredState : function(preferredState) {
			try {
				WDN.analytics.callTrackEvent('Navigation Preference', preferredState, WDN.analytics.thisURL, 0, true);
			} catch(e){}
		},
		
		callTrackPageview: function(thePage, trackInWDNAccount){
            if (trackInWDNAccount === undefined) {
                trackInWDNAccount = true;
            }
			var widthScript = WDN.getCurrentWidthScript();
			WDN.log('we can now track the page');
			if (!thePage) {
				_gaq.push(['wdn._trackPageview']);
				if (widthScript == '320') {
					_gaq.push(['m._trackPageview']);
				}
				return;
			}
			if (trackInWDNAccount) {
    			_gaq.push(['wdn._trackPageview', thePage]); //First, track in the wdn analytics
    			if (widthScript == '320') {
    				_gaq.push(['m._trackPageview', thePage]);
    			}
    			WDN.log("Pageview tracking for wdn worked!");
			}
			try {
				if (WDN.analytics.isDefaultTrackerReady()) {
					_gaq.push(['_trackPageview', thePage]); // Second, track in local site analytics 
					WDN.log("Pageview tracking for local site worked!");
				} else {
					throw "Default Tracker Account Not Set";
				}
			} catch(e) {
				WDN.log("Pageview tracking for local site didn't work."); 
			}
		},
		
		callTrackEvent: function(category, action, label, value, noninteraction) {
			var widthScript = WDN.getCurrentWidthScript();
			if (value === undefined) {
				value = 0;
			}
			if (noninteraction === undefined) {
			    noninteraction = false;
			}
			value = Math.floor(value);
			//var wdnSuccess = wdnTracker._trackEvent(category, action, label, value);
			_gaq.push(['wdn._trackEvent', category, action, label, value, noninteraction]);
			if (widthScript == '320') {
				_gaq.push(['m._trackEvent', category, action, label, value, noninteraction]);
			}
			try {
				if (WDN.analytics.isDefaultTrackerReady()) {
					var pageSuccess = _gaq.push(['_trackEvent', category, action, label, value, noninteraction]);
					WDN.log("Page Event tracking success? "+pageSuccess);
				} else {
					throw "Default Tracker Account Not Set";
				}
			} catch(e) {
				WDN.log("Event tracking for local site didn't work.");
			}
		},
		
		isDefaultTrackerReady: function() {
			if (typeof _gat != "undefined") {
				return _gat._getTrackerByName()._getAccount() != 'UA-XXXXX-X';
			}
			//assume the account is set async (we could check the _gaq queue, but that seems like overkill)
			return true;
		}
	};
}();
