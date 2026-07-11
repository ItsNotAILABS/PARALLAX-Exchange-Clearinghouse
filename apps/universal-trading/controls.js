const bind = (id, handlerName) => {
  const element = document.getElementById(id);
  if (!element) return;
  element.addEventListener('click', () => {
    const handler = window[handlerName];
    if (typeof handler !== 'function') {
      console.error(`PARALLAX control handler unavailable: ${handlerName}`);
      return;
    }
    handler();
  });
};

bind('connectEvmButton', 'connectEvm');
bind('connectSolanaButton', 'connectSolana');
bind('connectIcpButton', 'connectIcpPlug');
bind('paperRouteButton', 'queuePaperRoute');
