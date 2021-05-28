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
