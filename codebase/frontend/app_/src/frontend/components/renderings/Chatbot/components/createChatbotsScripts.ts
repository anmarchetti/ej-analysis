/** Codes for creation chat bot was provided by the team that developed it */

import { TLangs, TRedion, TSitecoreLangs } from 'code/cmsLang';
import { envPublic } from 'code/env';
import settings from 'code/settings';

export const createSalesChatbotScript = (
    title: string,
    SCAnalyticsGlobalValue: string,
    lang: TLangs,
    langWithMarket: TSitecoreLangs,
    region: TRedion,
): string => `
var urlAddress = window.location.href;

var newscripts = {
	gstatic: "https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1",
	uuvid:  'https://firebasestorage.googleapis.com/v0/b/ejh-chatbot.appspot.com/o/${envPublic.CHATBOT_API_FILE}',
	cypto:  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
	sha256: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/sha256.min.js',
	aes:    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/aes.min.js',
	google: 'https://maps.googleapis.com/maps/api/js?key=${envPublic.GOOGLE_MAPS_API_KEY}&callback=Function.prototype&libraries=places&language=${lang}&region=${region}' // change the language code to en/fr/de and the region to CH/FR/DE accordingly
};

var getEventType = () => {
    if ('ontouchstart' in document.documentElement === true)
      return 'touchstart';
    else
      return 'click';
};

var getClientID = () => {
	try {
        const prefix = 'GA1.1.';
        const cookieName = '_ga';
        const cookies = document.cookie.split('; ');

        for (let cookie of cookies) {
            const [name, value] = cookie.split('=');

            if (name === cookieName && value.startsWith(prefix)) {
                return value.slice(prefix.length);
            }
        }
    } catch (e) {
        console.log("Can't get client id");
    }

    return "undefined";
};

var resizeHandler = () => {
	if (window.innerWidth <= 500) {
        document.body.style.overflow = 'hidden';
    }
};

var initMap = (queryData) => {
	if (queryData != undefined) {
		var decryptParams = queryData;
		var data = JSON.parse(decryptParams);

		var map = new google.maps.Map(document.getElementById("map"), {
		  	center: new google.maps.LatLng(parseFloat(data[0].location.lat), parseFloat(data[0].location.lng)),
		  	mapTypeControl: false,
		});

		var latlngbounds = new google.maps.LatLngBounds();

		for (let i = 0; i < data.length; i++) {
		  	var markerLocation = {
				lat: parseFloat(data[i].location.lat),
				lng: parseFloat(data[i].location.lng),
		  	};

		  	const queryMarker = new google.maps.Marker({
				position: markerLocation,
				map: map,
				icon:
			  	data[i].type == "queriedHotel" ? {
						url: "https://firebasestorage.googleapis.com/v0/b/ejh-chatbot.appspot.com/o/Assets%2Fhotel.png?alt=media&token=929d3d0b-fa29-4207-8461-84df7688c05e",
						Scale: 0.075,
				  	} : {
						url: "https://firebasestorage.googleapis.com/v0/b/ejh-chatbot.appspot.com/o/Assets%2Fsecondary-marker.png?alt=media&token=ee533304-00be-4107-90e0-92fa19e2f030",
						Scale: 0.075,
					},
		  	});

			  var hotelContent = '<div id="content">' + '<div id="siteNotice">' + "</div>" + '<div id="firstHeading" class="firstHeading">' + data[i].name + "</div>" + "</div>";
			  var queryContent = '<div class="infoCardContent">' + '<div id="right-side">' + '<div id="firstHeading" class="firstHeading">' + data[i].name + "</div>" + '<div class="bodyContent">' + "This " + data[i].type + " is " + data[i].distance + " meters away " + "</div>" + "</div>" + "</div>";

		  	attachPopUpDialog(
				queryMarker,
				data[i].type == "queriedHotel" ? hotelContent : queryContent,
				data[i].type
		  	);
		  	latlngbounds.extend(queryMarker.position);
		};
		map.setCenter(latlngbounds.getCenter());
		map.fitBounds(latlngbounds);
	};
};

var attachPopUpDialog = (marker, dialogData, type) => {
	const infowindow = new google.maps.InfoWindow({
			content: dialogData,
	});

	marker.addListener(getEventType(), () => {
		if (!marker.open) {
		  	infowindow.open(marker.get("map"), marker);
		  	marker.setIcon(
				"https://firebasestorage.googleapis.com/v0/b/ejh-chatbot.appspot.com/o/Assets%2Fsecondary-marker-active.png?alt=media&token=122ce628-4c3c-497e-95ab-27246d71cced"
		  	);
		  	marker.open = true;
		} else {
		  	infowindow.close();
		  	type == "queriedHotel" ? marker.setIcon(
				"https://firebasestorage.googleapis.com/v0/b/ejh-chatbot.appspot.com/o/Assets%2Fhotel.png?alt=media&token=929d3d0b-fa29-4207-8461-84df7688c05e"
			)
			: marker.setIcon(
				"https://firebasestorage.googleapis.com/v0/b/ejh-chatbot.appspot.com/o/Assets%2Fsecondary-marker.png?alt=media&token=ee533304-00be-4107-90e0-92fa19e2f030"
			);
		  	marker.open = false;
		}
	});
};

var getLibrary = (url, id) => {
    return new Promise((resolve, reject) => {
        let scriptHTML = document.createElement('script');

        scriptHTML.type = 'text/javascript';
        scriptHTML.async = true;
        scriptHTML.src = url;

		if (id) {
			scriptHTML.id = id;
		}

        scriptHTML.onload = function () {
            resolve(url);
        };
        scriptHTML.onerror = function () {
            reject('error')
        };
		document.head.appendChild(scriptHTML);
    });
};

var scriptExists = (url, id) => {
    var scriptSelector = \`script[src="\${url}\"]\`;
	if (id) {
	    scriptSelector = \`script[id="\${id}\"]\`;
	}

	return document.querySelectorAll(scriptSelector).length > 0;
};

var checkGoogle = !scriptExists(newscripts.google, '${settings.Default.googleMapsScriptId}') ? getLibrary(newscripts.google, '${settings.Default.googleMapsScriptId}') : Promise.resolve();
var checkGStatic = !scriptExists(newscripts.gstatic) ? getLibrary(newscripts.gstatic) : Promise.resolve();
var checkUuvid = !scriptExists(newscripts.uuvid) ? getLibrary(newscripts.uuvid) : Promise.resolve();
var checkCypto = !scriptExists(newscripts.cypto) ? getLibrary(newscripts.cypto) : Promise.resolve();
var checkSha256 = !scriptExists(newscripts.sha256) ? getLibrary(newscripts.sha256) : Promise.resolve();
var checkAes = !scriptExists(newscripts.aes) ? getLibrary(newscripts.aes) : Promise.resolve();

var removeScript = (script) => {
	var elem = document.querySelector(\`script[src="\${script}\"]\`);
	elem.remove();
};

var strip = () => {
	requestAnimationFrame(()=>{
		if (urlAddress !== location.href) {
			removeScript(newscripts.gstatic);
			removeScript(newscripts.uuvid);
			removeScript(newscripts.cypto);
			removeScript(newscripts.sha256);
			removeScript(newscripts.aes);

			document.getElementsByTagName("df-messenger");
			for (let index = 0; index < document.getElementsByTagName("df-messenger").length; index++) {
				const element = document.getElementsByTagName("df-messenger")[index];
				element.remove();
			};

			['popstate', 'onload'].forEach( evt =>
				window.removeEventListener(evt, strip, true)
			);
		};
		urlAddress = location.href;
	});
};

var loadMap = function () {
    return Promise.all([
				checkGoogle, checkGStatic, checkUuvid, checkCypto, checkSha256, checkAes
			])
			.then(() => {;
				var clientId 		= getClientID();
				var newUrl 			= window.location + "|+|" + clientId;
				var sessionID 		= uuidv4();

				setTimeout(function () {
                    var deltaCookie = "SC_ANALYTICS_GLOBAL_COOKIE=" + '${SCAnalyticsGlobalValue}';
					var messenger 	= document.createElement("df-messenger");

					messenger.setAttribute("intent", '${title}');
					var welcomeLang = '${lang}'; //OR fr or de
					switch(welcomeLang) {
						case "fr":
						messenger.setAttribute("chat-title", "Comment pouvons nous aider?");
						break;
						case "de":
						messenger.setAttribute("chat-title", "Wie können wir helfen?");
						break;
						default:
						messenger.setAttribute("chat-title", "How can we help?");
					}

					messenger.setAttribute("agent-id","4e60f08e-a88e-4efa-a626-f161a9477461");
					messenger.setAttribute("language-code", '${lang}'); // change this to "fr" or "de" accordingly
					messenger.setAttribute("chat-icon","https://firebasestorage.googleapis.com/v0/b/ejh-chatbot.appspot.com/o/Assets%2Fchat.png?alt=media&token=ca291099-5936-4cc3-831c-10644f0ff5cf");
                    messenger.setAttribute("user-id", newUrl + "|" + deltaCookie + "|${langWithMarket}"); // change this to "fr", "ch-fr", "de", or "ch-de" accordingly
					messenger.setAttribute("session-id", sessionID);

					var scrollYstore = window.pageYOffset || document.documentElement.scrollTop;

					var observer = new MutationObserver(function (mutations) {
						mutations.forEach(function (mutation) {
							if (mutation.type == "attributes") {
								if (messenger.hasAttribute("expand")) {
									window.addEventListener("resize", resizeHandler);
									resizeHandler();
									window.addEventListener('popstate', () => messenger.removeAttribute('expand'));
									scrollYstore = window.pageYOffset || document.documentElement.scrollTop;
								} else {
									window.removeEventListener("resize", resizeHandler);
									if (window.innerWidth <= 500) {
									    document.body.style.overflow = 'visible';
									    document.documentElement.scrollTop = scrollYstore;
									}
									window.removeEventListener('popstate', () => messenger.removeAttribute('expand'));
								};
							};
						});
					});

					observer.observe(messenger, {
						attributes: true,
					});

					var chatbot = document.getElementsByClassName('chatbot')[0];
                    chatbot.appendChild(messenger);
					var modal = document.getElementById("myModal");
					const dfMessenger = document.querySelector("df-messenger");

					var styles = document.createElement("style");
					styles.innerHTML = "@media screen and (max-width: 500px) {button#widgetIcon {bottom: 55px !important} .df-messenger-wrapper{z-index: 250}}";
					messenger.shadowRoot.appendChild(styles);
					var tmp = document.createElement("style");
					tmp.innerHTML = "@media screen and (max-width: 500px) {div.chat-wrapper {bottom: 160px !important}}";
					messenger.shadowRoot.appendChild(tmp);
					var chatbot = document.getElementsByClassName('chatbot')[0];
                    chatbot.classList.add("sales-chatbot--shown");

					dfMessenger.addEventListener("df-button-clicked", function (event) {
						// Handle event
						if (
							event.detail.element.event_.parameters?.action === "showMap"
						) {
							modal.style.display = "block";
							var queryData = JSON.stringify(event.detail.element.event_.parameters.partialJson);
							window.initMap = initMap(queryData);
						};
					});
				}, 20000);
		}).catch(error => new Error('Unable to inject files'));
};

var createModal = () => {
	const modal 		= document.createElement("div");
	const modalContent 	= document.createElement("div");
	const modalBanner 	= document.createElement("div");
	const modalTitle 	= document.createElement("p");
	const close 		= document.createElement("span");
	const content 		= document.createElement("div");
	const mapDiv 		= document.createElement("div");
    const hotelView = document.querySelector('.chatbot');

	modal.classList.add("modal");
	modal.setAttribute("id", "myModal");
	modalContent.classList.add("modal-content");
	modalBanner.classList.add("modal-banner");
	modalTitle.classList.add("modal-title");
	modalTitle.innerHTML = "Location search";
	close.classList.add("close");
	close.innerHTML = "&times;";
	content.classList.add("content");
	mapDiv.setAttribute("id", "map");

	modal.appendChild(modalContent);
	modalContent.appendChild(modalBanner);
	modalBanner.appendChild(modalTitle);
	modalBanner.appendChild(close);
	modalContent.appendChild(content);
	content.appendChild(mapDiv);
	hotelView.appendChild(modal);

	close.onclick = function () {
		modal.style.display = "none";
	};

	window.onclick = function (event) {
		if (event.target == modal) {
			modal.style.display = "none";
		};
	};
};

loadMap();
createModal();

['popstate', 'onload'].forEach( evt =>
	{
		window.addEventListener(evt, strip, true)
	}
);
`;

export const createHelpChatbotScript = (
    title: string,
    SCAnalyticsGlobalValue: string,
    lang: TLangs,
    langWithMarket: TSitecoreLangs,
): string => `var messenger = document.createElement('df-messenger');


  var deltaCookie = "SC_ANALYTICS_GLOBAL_COOKIE=" + '${SCAnalyticsGlobalValue}';
messenger.setAttribute('intent', '${title}');
messenger.setAttribute("user-id", "|" + deltaCookie + "|${langWithMarket}"); // change this to "fr", "ch-fr", "de", or "ch-de" accordingly
var welcomeLang = '${lang}'; //OR fr or de
switch(welcomeLang) {
	case "fr":
	messenger.setAttribute("chat-title", "Comment pouvons nous aider?");
	break;
	case "de":
	messenger.setAttribute("chat-title", "Wie können wir helfen?");
	break;
	default:
	messenger.setAttribute("chat-title", "How can we help?");
}
messenger.setAttribute('agent-id', '4e60f08e-a88e-4efa-a626-f161a9477461');
messenger.setAttribute('language-code', '${lang}'); // change this to "fr" or "de" accordingly
messenger.setAttribute(
    'chat-icon',
    'https://firebasestorage.googleapis.com/v0/b/ejh-chatbot.appspot.com/o/Assets%2Fchat.png?alt=media&token=ca291099-5936-4cc3-831c-10644f0ff5cf',
);
var scrollYstore = window.pageYOffset || document.documentElement.scrollTop;
function resizeHandler() {
    if (window.innerWidth <= 500) {
        document.body.style.overflow = 'hidden';
    }
}
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type == 'attributes') {
            if (messenger.hasAttribute('expand')) {
                window.addEventListener('resize', resizeHandler);
                resizeHandler();
				window.addEventListener('popstate', () => messenger.removeAttribute('expand'));
                scrollYstore = window.pageYOffset || document.documentElement.scrollTop;
            } else {
                window.removeEventListener('resize', resizeHandler);
                if (window.innerWidth <= 500) {
                    document.body.style.overflow = 'visible';
                    document.documentElement.scrollTop = scrollYstore;
                }
				window.removeEventListener('popstate', () => messenger.removeAttribute('expand'));
                document.documentElement.scrollTop = scrollYstore;
            }
        }
    });
});
observer.observe(messenger, {
    attributes: true, //configure it to listen to attribute changes
});
var chatbot = document.getElementsByClassName('chatbot')[0];
chatbot.appendChild(messenger);
`;
