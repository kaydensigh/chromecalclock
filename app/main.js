// Injected by background.js:
// var settings = { timezone: [], alwaysOnTop: false, autoHide: false, weekStartSunday: false, hour24: false};
// var updateSettings = function (settings, reload) {};

var appWindow = chrome.app.window.current();

function resizeWindow(width) {
  let container = document.getElementById('container');
  container.style.width = width + 'px';
  container.style.height = '200px';
  document.body.style.height = '200px';
  document.body.parentElement.style.height = '200px';

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

  let noticeOverlay = document.getElementById('noticeOverlay');
  let noticeIcon = document.getElementById('noticeIcon');
  noticeIcon.style.display = 'block';
  noticeIcon.addEventListener('click', function () {
    noticeOverlay.style.display = 'flex';
  });
  noticeOverlay.addEventListener('click', function (e) {
    if (e.target.id == 'noticeOverlay') {
      noticeOverlay.style.display = 'none';
    }
  });
});
