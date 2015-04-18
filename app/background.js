// Determine if the local locale uses a 24-hour clock. Since
// DateTimeFormat.resolvedOptions().hour12 is not provided, look at
// DateTimeFormat.resolved.pattern instead. The spec for the pattern is here:
// http://unicode.org/reports/tr35/tr35-6.html#Date_Format_Patterns
function localLocaleUsesHour24() {
  var dateFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });
  var pattern = dateFormat.resolved.pattern;
  // According to the spec, any occurrence of two adjacent single quotes (even
  // within a quoted section) represent the single quote character.
  pattern = pattern.replace("''", "");
  // Now remove all quoted sections.
  pattern = pattern.replace(/'[^']*'/, '');
  // What remains is only the format pattern, in which the following represent
  // digits of the hour:
  // 'h': [1-12]
  // 'H': [0-23]
  // 'K': [0-11]
  // 'k': [1-24]
  return pattern.indexOf('H') != -1 || pattern.indexOf('k') != -1;
}

var defaultSettings = {
  timezones: [],
  alwaysOnTop: true,
  autoHide: true,
  weekStartSunday: false,
  hour24: localLocaleUsesHour24(),
}

function applySettings(settings, baseSettings) {
  if (typeof settings != 'object') {
    return baseSettings;
  }
  var newSettings = {
    timezones: baseSettings.timezones,
    alwaysOnTop: typeof settings.alwaysOnTop == 'boolean' ? settings.alwaysOnTop : baseSettings.alwaysOnTop,
    autoHide: typeof settings.autoHide == 'boolean' ? settings.autoHide : baseSettings.autoHide,
    weekStartSunday: typeof settings.weekStartSunday == 'boolean' ? settings.weekStartSunday : baseSettings.weekStartSunday,
    hour24: typeof settings.hour24 == 'boolean' ? settings.hour24 : baseSettings.hour24,
  };
  if (Array.isArray(settings.timezones)) {
    newSettings.timezones = settings.timezones.concat(
        baseSettings.timezones.filter(function (timezone) {
          return settings.timezones.indexOf(timezone) == -1;
        }));
  }
  return newSettings;
}

function readFromStorage(callback) {
  var localStorage = null;
  var syncStorage = null;

  var loadComplete = function () {
    if (!localStorage || !syncStorage) {
      return;
    }
    var lastBounds = localStorage['bounds'];
    var settings = applySettings(localStorage['settings'], applySettings(syncStorage['settings'], defaultSettings));
    callback(lastBounds, settings);
  };

  chrome.storage.local.get(null, function (fromStorage) {
    localStorage = fromStorage;
    loadComplete();
  });
  chrome.storage.sync.get(null, function (fromStorage) {
    syncStorage = fromStorage;
    loadComplete();
  });
}

function onLaunched() {
  readFromStorage(function(lastBounds, settings) {
    var options = {
      frame: 'none',
      width: 400 + 160 * settings.timezones.length,
      height: 200,
      resizable: false,
      alwaysOnTop: settings.alwaysOnTop,
    }
    if (lastBounds) {
      options.left = lastBounds.left;
      options.top = lastBounds.top;
    }
    // Bug in Windows where minimized windows get their top/left set as below.
    if (options.left == -32000) {
      options.left = undefined;
    }
    if (options.top == -32000) {
      options.top = undefined;
    }
    chrome.app.window.create('main.html', options, getSetupWindowCallback(settings));
  });
}

function getSetupWindowCallback(settings) {
  return function (win) {
    win.onBoundsChanged.addListener(function () {
      if (!win.isMinimized()) {
        chrome.storage.local.set({ 'bounds': win.getBounds() }, function() {});
      }
    });

    win.contentWindow.settings = settings;
    win.contentWindow.updateSettings = function (settings, reload) {
      var localSettings = {
        alwaysOnTop: settings.alwaysOnTop,
        autoHide: settings.autoHide,
      };
      var syncSettings = {
        timezones: settings.timezones,
        weekStartSunday: settings.weekStartSunday,
        hour24: settings.hour24,
      };
      chrome.storage.local.set({ 'settings': localSettings }, function() {
        chrome.storage.sync.set({ 'settings': syncSettings }, function () {
          if (reload) {
            win.close();
            onLaunched();
          }
        });
      });
    };
  };
}

chrome.app.runtime.onLaunched.addListener(onLaunched);
