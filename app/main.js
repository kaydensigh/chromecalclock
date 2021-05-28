// Injected by background.js:
// var settings = { timezone: [], alwaysOnTop: false, autoHide: false, weekStartSunday: false, hour24: false};
// var updateSettings = function (settings, reload) {};

var appWindow = chrome.app.window.current();

function getTzMessage(name) {
  return chrome.i18n.getMessage('tz_' + name.replace('/', '___').replace('-', '__'));
}

function getChromeTimeZone(timezone) {
  return timezoneReplacements[timezone] || timezone;
}

function NewDateTimeFormat(options) {
  if (options.timeZone) {
    options.timeZone = getChromeTimeZone(options.timeZone);
  }
  return new Intl.DateTimeFormat(undefined, options);
}

function IsTimezoneSupported(timezone) {
  try {
    NewDateTimeFormat({ timeZone: timezone });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function resizeWindow(width) {
  var bounds = appWindow.getBounds();
  bounds.width = width;
  appWindow.setBounds(bounds);
}

function setupUiStrings() {
  [].forEach.call(document.getElementsByClassName('__MSG'), function (element) {
    element.textContent = chrome.i18n.getMessage(element.textContent);
  });
}

function hide() {
  appWindow.close();
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
