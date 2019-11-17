// Injected by background.js:
// var settings = { timezone: [], alwaysOnTop: false, autoHide: false, weekStartSunday: false, hour24: false};
// var updateSettings = function (settings, reload) {};

var calendar = null;
var timezones = [];
var appWindow = chrome.app.window.current();

function makeTicks() {
  [].forEach.call(document.getElementsByClassName('hour_ticks'), function (hourTicks) {
    for (var i = 0; i < 360; i += 30) {
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 38);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', 40);
      line.setAttribute('y2', 0);
      line.setAttribute('transform', 'rotate(' + i + ', 0, 0)')
      hourTicks.appendChild(line);
    }
  });
  [].forEach.call(document.getElementsByClassName('minute_ticks'), function (minuteTicks) {
    for (var i = 0; i < 360; i += 6) {
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 40);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', 40);
      line.setAttribute('y2', 0);
      line.setAttribute('transform', 'rotate(' + i + ', 0, 0)')
      minuteTicks.appendChild(line);
    }
  });
}

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
  return new Intl.DateTimeFormat('en-US', options);
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

function GetLocalTimezoneName() {
  // Intl.DateTimeFormat.resolvedOptions().timeZone should provide the local
  // time zone but it doesn't always work. jstimezonedetect will try it first,
  // then try to determine the local time zone.
  return jstz.determine().name();
}

function rebuildClocks() {
  [].forEach.call(document.querySelectorAll('.clockDiv'), function (element) {
    if (element.id != 'clock0') {
      element.parentNode.removeChild(element);
    }
  });
  [].forEach.call(document.querySelectorAll('#settingsOverlay .removeTimezoneDiv'), function (element) {
    element.parentNode.removeChild(element);
  });

  // Remove any time zones that Chrome won't handle.
  for (var t in settings.timezones) {
    if (!IsTimezoneSupported(settings.timezones[t])) {
      // This recursively calls rebuildClocks, so return here.
      removeTimezone(t);
      return;
    }
  }

  timezones = settings.timezones.slice(0);
  var clock0 = document.getElementById('clock0');
  clock0.className = timezones.length ? 'clockDiv clockSmall' : 'clockDiv clockLarge';
  var removeTimezoneTemplate = document.getElementById('removeTimezoneTemplate');
  var settingsOverlay = document.getElementById('settingsOverlay');
  timezones.forEach(function (timezone, index) {
    var extraClock = clock0.clone(true);
    extraClock.id = 'clock' + (index + 1);
    clock0.parentNode.appendChild(extraClock);
    var removeTimezoneButton = removeTimezoneTemplate.clone(true);
    removeTimezoneButton.removeAttribute('id');
    removeTimezoneButton.addEventListener('click', function () { removeTimezone(index); });
    settingsOverlay.appendChild(removeTimezoneButton);
  });
  // Push local time zone to front;
  timezones.unshift(undefined);

  var date = new Date();
  timezones.forEach(function (timezone, i) {
    var dateFormat = NewDateTimeFormat({ timeZone: timezone });
    var dateString = dateFormat.format(date);
    var timeZoneFormat = NewDateTimeFormat({ timeZoneName: 'long', timeZone: timezone });
    var dateAndTimeZoneString = timeZoneFormat.format(date);
    var timeZoneString = dateAndTimeZoneString.replace(dateString, '').trim();
    document.querySelector('#clock' + i + ' .time').title = timeZoneString;

    // Use the canonical time zone, if it's undefined (for the local clock) use jstimezonedetect.
    var timezoneName = timezone || GetLocalTimezoneName();
    // Get the city name using the canonical time zone.
    // Some time zones might have multiple '/', remove the first part (the region).
    var city = timezoneName.split('/').slice(1).join('/');
    // Get the localized string, then show the last part as the city name.
    // If there's no localized string, just use the city name from the time zone.
    var cityStrings = getTzMessage(city).split('/');
    var cityString = cityStrings[cityStrings.length - 1] || city;
    document.querySelector('#clock' + i + ' .city').textContent = cityString;
  });

  var bounds = appWindow.getBounds();
  bounds.width = 400 + 160 * settings.timezones.length;
  appWindow.setBounds(bounds);
}

function setupUiStrings() {
  [].forEach.call(document.getElementsByClassName('__MSG'), function (element) {
    element.textContent = chrome.i18n.getMessage(element.textContent);
  });
}

function makeCalendar() {
  var days = [];
  var daysShort = [];
  var months = [];
  var monthsShort = [];

  var date = new Date();
  for (var d = 1; d <= 7; d++) {
    date.setFullYear(2012, 1, d);
    var wd = date.getDay();
    days[wd] = NewDateTimeFormat({ weekday: 'long' }).format(date);
    daysShort[wd] = NewDateTimeFormat({ weekday: 'short' }).format(date);
  }
  for (var m = 0; m < 12; m++) {
    date.setFullYear(2012, m, 1);
    months.push(NewDateTimeFormat({ month: 'long' }).format(date));
    monthsShort.push(NewDateTimeFormat({ month: 'short' }).format(date));
  }

  if (calendar) {
    calendar.destroy();
  }
  calendar = new DatePicker('.calendar', {
    pickerClass: 'datepicker_calendar',
    persistent: true,
    useFadeInOut: false,

    days: days,
    daysShort: daysShort,
    months: months,
    monthsShort: monthsShort,

    startDay: settings.weekStartSunday ? 0 : 1,
  });
  calendar.show({ left: 0, top: 0 });
}

function getSelectedRegion() {
  var regionSelect = document.getElementById('timezoneRegions');
  return regionSelect.options[regionSelect.selectedIndex].value;
}

function showCitiesByRegion() {
  [].forEach.call(document.querySelectorAll('span[id="timezoneRegionCities"] select'), function (select) {
    select.style.display = 'none';
  });
  document.querySelector('span[id="timezoneRegionCities"] select[id="' + getSelectedRegion() + '"]').style.display = 'inline';
}

function hide() {
  appWindow.close();
}

function applySettings() {
  var autoHideCheckbox = document.getElementById('autoHide');
  settings.autoHide = autoHideCheckbox.checked;
  if (settings.autoHide) {
    window.addEventListener('blur', hide);
  } else {
    window.removeEventListener('blur', hide);
  }
  var alwaysOnTopCheckbox = document.getElementById('alwaysOnTop');
  settings.alwaysOnTop = alwaysOnTopCheckbox.checked;
  appWindow.setAlwaysOnTop(settings.alwaysOnTop);
  var weekStartSundayCheckbox = document.getElementById('weekStartSunday');
  settings.weekStartSunday = weekStartSundayCheckbox.checked;
  var hour24Checkbox = document.getElementById('hour24');
  settings.hour24 = hour24Checkbox.checked;
}

function applyAndSaveSettings() {
  var weekStartSundayCheckbox = document.getElementById('weekStartSunday');
  var weekStartChanged = settings.weekStartSunday != weekStartSundayCheckbox.checked;
  applySettings();
  updateSettings(settings, weekStartChanged);
}

function addTimezone() {
  var region = getSelectedRegion();
  var citySelect = document.querySelector('#timezoneRegionCities #' + region);
  var city = citySelect.options[citySelect.selectedIndex].value;
  var timezone = region + '/' + city;
  settings.timezones.push(timezone);
  updateSettings(settings);
  rebuildClocks();
}

function removeTimezone(index) {
  settings.timezones.splice(index, 1);
  updateSettings(settings);
  rebuildClocks();
}

function setupSettings() {
  var autoHideCheckbox = document.getElementById('autoHide');
  autoHideCheckbox.checked = settings.autoHide;
  autoHideCheckbox.addEventListener('change', applyAndSaveSettings);
  var alwaysOnTopCheckbox = document.getElementById('alwaysOnTop');
  alwaysOnTopCheckbox.checked = settings.alwaysOnTop;
  alwaysOnTopCheckbox.addEventListener('change', applyAndSaveSettings);
  var weekStartSundayCheckbox = document.getElementById('weekStartSunday');
  weekStartSundayCheckbox.checked = settings.weekStartSunday;
  weekStartSundayCheckbox.addEventListener('change', applyAndSaveSettings);
  var hour24Checkbox = document.getElementById('hour24');
  hour24Checkbox.checked = settings.hour24;
  hour24Checkbox.addEventListener('change', applyAndSaveSettings);

  var currentTimezone = GetLocalTimezoneName();
  // Some time zones have multiple '/', so take the first part as region and the rest as city.
  var splitIndex = currentTimezone.indexOf('/');
  var currentRegion = currentTimezone.substring(0, splitIndex);
  var currentCity = currentTimezone.substring(splitIndex + 1);

  var timezoneRegions = document.getElementById('timezoneRegions');
  var timezoneRegionCities = document.getElementById('timezoneRegionCities');
  var regionsArray = [];

  var compare = new Intl.Collator().compare;

  availableRegions.forEach(function (region) {
    var regionOption = document.createElement('option');
    regionOption.value = region;
    regionOption.textContent = getTzMessage(region);
    if (region == currentRegion) {
      regionOption.selected = true;
    }
    regionsArray.push(regionOption);

    var cities = availableTimezones[region];
    var citySelect = document.createElement('select');
    citySelect.id = region;
    citySelect.className = 'timezoneCities';
    citySelect.style.display = 'none';
    var citiesArray = [];
    if (cities) {
      cities.forEach(function (city) {
        var cityOption = document.createElement('option');
        cityOption.value = city;
        cityOption.textContent = getTzMessage(city);
        if (city == currentCity) {
          cityOption.selected = true;
        }
        citiesArray.push(cityOption);
      });
    } else {
      citySelect.disabled = true;
    }
    citiesArray.sort(function (a, b) {
      return compare(a.textContent, b.textContent);
    });
    citiesArray.forEach(function (cityOption) {
      citySelect.appendChild(cityOption);
    });
    timezoneRegionCities.appendChild(citySelect);
  });
  regionsArray.sort(function (a, b) {
    return compare(a.textContent, b.textContent);
  });
  regionsArray.forEach(function (regionOption) {
    timezoneRegions.appendChild(regionOption);
  });

  timezoneRegions.addEventListener('change', showCitiesByRegion);
  showCitiesByRegion();

  document.getElementById('addTimezone').addEventListener('click', addTimezone);

  var overlay = document.getElementById('settingsOverlay');
  document.getElementById('settingsCog').addEventListener('click', function () {
    overlay.style.top = '0';
  });
  overlay.addEventListener('click', function (e) {
    if (e.target.id == 'settingsOverlay') {
      overlay.style.top = '100%';
    }
  });
}

function timerTick() {
  var now = new Date();
  timezones.forEach(function (timezone, i) {
    var hours = NewDateTimeFormat({ hour: '2-digit', hour12: false, timeZone: timezone }).format(now);
    var minutes = Number.parseInt(NewDateTimeFormat({ minute: '2-digit', timeZone: timezone }).format(now));
    var seconds = now.getSeconds();

    var h = 30 * ((hours % 12) + minutes / 60 + seconds / 360);
    var m = 6 * (minutes + seconds / 60);
    var s = 6 * seconds;

    document.querySelector('#clock' + i + ' .hour_hand').setAttribute('transform', 'rotate(' + h + ', 0, 0)');
    document.querySelector('#clock' + i + ' .minute_hand').setAttribute('transform', 'rotate(' + m + ', 0, 0)');
    document.querySelector('#clock' + i + ' .second_hand').setAttribute('transform', 'rotate(' + s + ', 0, 0)');

    document.querySelector('#clock' + i + ' .time').textContent =
        now.toLocaleTimeString(undefined, { timeZone: getChromeTimeZone(timezone), hour12: !settings.hour24 });
    document.querySelector('#clock' + i + ' .date').textContent =
        now.toLocaleDateString(undefined, { timeZone: getChromeTimeZone(timezone), weekday: 'long', month: 'long', day: 'numeric'  });
  });

  if (calendar.today.getDate() != now.getDate()) {
    makeCalendar();
  }

  setTimeout(timerTick, 1000);
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

function checkTimezones() {
availableRegions.forEach(function (region) {
  availableTimezones[region].forEach(function (city) {
    IsTimezoneSupported(region + '/' + city);
  });
});
}
