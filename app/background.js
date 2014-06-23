function defaultSettings(settings) {
  settings = typeof settings == 'object' ? settings : {};
  return {
    timezones: Array.isArray(settings.timezones) ? settings.timezones : [],
    alwaysOnTop: typeof settings.alwaysOnTop == 'boolean' ? settings.alwaysOnTop : true,
    autoHide: typeof settings.autoHide == 'boolean' ? settings.autoHide : true,
    weekStartSunday: typeof settings.weekStartSunday == 'boolean' ? settings.weekStartSunday : false,
  };
}

function onLaunched() {
  chrome.storage.sync.get(null, function(fromStorage) {
    var lastBounds = fromStorage['bounds'];
    var settings = defaultSettings(fromStorage['settings']);
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
      chrome.storage.sync.set({ 'bounds': win.getBounds() }, function() {});
    });

    win.contentWindow.settings = settings;
    win.contentWindow.updateSettings = function (settings, reload) {
      chrome.storage.sync.set({ 'settings': settings }, function() {
        if (reload) {
          win.close();
          onLaunched();
        }
      });
    };
  };
}

chrome.app.runtime.onLaunched.addListener(onLaunched);
