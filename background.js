chrome.action.onClicked.addListener(() => {
  // Abre em uma nova aba em vez de uma janela popup
  chrome.tabs.create({
    url: 'app.html'
  });
}); 