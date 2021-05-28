function readFromStorage(callback) {
  var localStorage = null;
  var syncStorage = null;

  var loadComplete = function () {
    if (!localStorage || !syncStorage) {
      return;
    }
    var lastBounds = localStorage['bounds'];
    var settings = overlaySettings(localStorage['settings'], overlaySettings(syncStorage['settings'], defaultSettings));
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
    chrome.app.window.create('common/main.html', options, getSetupWindowCallback(settings));
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
