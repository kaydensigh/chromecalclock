// Injected by background.js:
// var settings = { timezone: [], alwaysOnTop: false, autoHide: false, weekStartSunday: false, hour24: false};
// var updateSettings = function (settings, reload) {};

var appWindow = chrome.app.window.current();

function resizeWindow(width) {
  var bounds = appWindow.getBounds();
  bounds.width = width;
  appWindow.setBounds(bounds);
}

function hide() {
  appWindow.close();
}

function enactAutoHide(autoHide) {
  if (autoHide) {
    window.addEventListener('blur', hide);
  } else {
    window.removeEventListener('blur', hide);
  }
}

function enactAlwaysOnTop(alwaysOnTop) {
  appWindow.setAlwaysOnTop(alwaysOnTop);
}

window.addEvent('load', function() {
  makeTicks();
  rebuildClocks();
  setupUiStrings();
  makeCalendar();
  setupSettings();
  applySettings();
  timerTick();
});
