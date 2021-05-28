// Determine if the local locale uses a 24-hour clock.
function localLocaleUsesHour24() {
  var dateFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });
  return !dateFormat.resolvedOptions().hour12;
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
