var defaultSettings = {
  timezones: [],
  alwaysOnTop: true,
  autoHide: true,
  weekStartSunday: false,
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
    chrome.app.window.create('main.html', options, getSetupWindowCallback(settings));
  });
}

function getSetupWindowCallback(settings) {
  return function (win) {
    win.onBoundsChanged.addListener(function () {
      chrome.storage.local.set({ 'bounds': win.getBounds() }, function() {});
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
