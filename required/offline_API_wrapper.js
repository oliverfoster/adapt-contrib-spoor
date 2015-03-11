function createResetButton() {
	$('body').append($('<style id="spoor-clear-button">.spoor-clear-button { position:fixed; right:0px; bottom:0px; } </style>'));
	var $button = $('<button class="spoor-clear-button">Reset</button>');
	$('body').append($button);
	$button.on("click", function() {
		API.LMSClear();
		alert("Status Reset");
		window.location.reload();
	});
}


var API = {
	LMSInitialize: function() {
		createResetButton();
		console.log("LMSInitialize");
		if (!API.LMSFetch()) {
			this.data["cmi.core.lesson_status"] = "not attempted";
			this.data["cmi.suspend_data"] = "";
			this.data["cmi.core.student_name"] = "Test Student";
			API.LMSStore(true);
		}
		return "true";
	},
	LMSFinish: function() {
		return "true";
	},
	LMSGetValue: function(key) {
		console.log('LMSGetValue("' + key + '") - ' + this.data[key]);
		return this.data[key];
	},
	LMSSetValue: function(key, value) {
		console.log('LMSSetValue("' + key + '") - ' + value);
		this.data[key] = value;
		API.LMSStore();
		return "true";
	},
	LMSCommit: function() {
		return "true";
	},
	LMSGetLastError: function() {
		return 0;
	},
	LMSGetErrorString: function() {
		return "Fake error string.";
	},
	LMSGetDiagnostic: function() {
		return "Fake diagnostic information."
	},
	LMSStore: function(force) {
		console.log("LMSStore");
		if (!force && API.cookie("_spoor") === undefined) return;
		API.cookie("_spoor", JSON.stringify(this.data));
	},
	LMSFetch: function() {
		console.log("LMSFetch");
		this.data = API.cookie("_spoor");
		if (this.data === undefined) {
			this.data = {}
			return false;
		} else {
			this.data = JSON.parse(this.data);
			return true;
		}
	},
	LMSClear: function() {
		console.log("LMSClear");
		API.removeCookie("_spoor");
	}
};


(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(function() {
			return factory(API);
		});
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(API);
	} else {
		// Browser globals
		factory(API);
	}
}(function ($) {

	$.isFunction = function( obj ) {
		return typeof obj == "function";
	};

	$.extend = function() {
		var src, copyIsArray, copy, name, options, clone,
			target = arguments[0] || {},
			i = 1,
			length = arguments.length;

		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && !$.isFunction(target) ) {
			target = {};
		}

		// extend jQuery itself if only one argument is passed
		if ( i === length ) {
			target = this;
			i--;
		}

		for ( ; i < length; i++ ) {
			// Only deal with non-null/undefined values
			if ( (options = arguments[ i ]) != null ) {
				// Extend the base object
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					// Prevent never-ending loop
					if ( target === copy ) {
						continue;
					}

					if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	};

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (arguments.length > 1 && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setTime(+t + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {};

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
		var cookies = document.cookie ? document.cookie.split('; ') : [];

		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			var name = decode(parts.shift());
			var cookie = parts.join('=');

			if (key && key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key) === undefined) {
			return false;
		}

		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));