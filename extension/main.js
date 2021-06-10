//// Settings

function readFromStorage(callback) {
  console.log('readFromStorage');
  chrome.storage.sync.get(null, function (fromStorage) {
    console.log('fromStorage');
    console.log(fromStorage['settings']);
    callback(overlaySettings(fromStorage['settings'], defaultSettings))
  });
}

function updateSettings(settings) {
  var syncSettings = {
    timezones: settings.timezones,
    weekStartSunday: settings.weekStartSunday,
    hour24: settings.hour24,
  };
  chrome.storage.sync.set({ 'settings': syncSettings }, function () {
    console.log('Updated settings:');
    console.log(settings);
  });
};

//// App

function resizeWindow(width) {
  let container = document.getElementById('container');
  container.style.width = width + 'px';
  container.style.height = '200px';
  document.body.style.height = '200px';
  document.body.parentElement.style.height = '200px';
}

function enactAutoHide() { }

function enactAlwaysOnTop() { }

window.addEvent('load', function () {
  readFromStorage(function (gotSettings) {
    console.log('gotSettings');
    console.log(gotSettings);
    settings = gotSettings;
    console.log('read settings');
    makeTicks();
    rebuildClocks();
    setupUiStrings();
    makeCalendar();
    setupSettings();
    applySettings();

    for (let element of document.getElementsByClassName('hideInExtension')) {
      element.style.display = 'none';
    }

    timerTick();
  });
});
