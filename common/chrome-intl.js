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

function setupUiStrings() {
  [].forEach.call(document.getElementsByClassName('__MSG'), function (element) {
    element.textContent = chrome.i18n.getMessage(element.textContent);
  });
}
