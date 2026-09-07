async function runFabEditor(args) {
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  for (let i = 0; i < 40 && !window.ue?.[args.bindingName]?.complete; ++i) await pause(50);
  const reply = window.ue?.[args.bindingName];
  if (!reply?.complete) return;
  const complete = reply.complete.bind(reply);
  const respond = value => complete(args.replyNonce, JSON.stringify(value));
  const fail = error => respond({ success: false, error });
  if (location.protocol !== 'https:' || (location.port && location.port !== '443') || !['fab.com', 'www.fab.com'].includes(location.hostname))
    return fail('Fab is not on the approved production origin.');
  const text = node => (node.getAttribute('aria-label') || node.getAttribute('title') ||
    (node.tagName === 'INPUT' && (node.type === 'search' || /search/i.test(node.getAttribute('placeholder') || '')) ? node.getAttribute('placeholder') : '') || node.innerText || '').replace(/\s+/g, ' ').trim();
  const visible = node => node.isConnected && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden';
  const safeHref = node => {
    try {
      const url = new URL(node.getAttribute('href'), location.href);
      return url.protocol === 'https:' && (!url.port || url.port === '443') && ['fab.com', 'www.fab.com'].includes(url.hostname) ? url.origin + url.pathname : '';
    } catch { return ''; }
  };
  const fingerprint = node => [node.tagName, node.getAttribute('role') || '', text(node), node.getAttribute('href') || ''].join('|');
  const libraryNavigation = node => node.tagName === 'A' && text(node) === 'Purchases' && /\/plugins\/ue5\/library\/?$/.test(safeHref(node));
  const forbidden = /buy|purchase|checkout|cart|wishlist|favorite|favourite|subscribe|follow|place order|payment|install to engine|add to (my )?library|claim|delete|remove|sign out|log out/i;
  const downloadLabel = /^(add to project|download|download now|import)$/i;
  const nodes = () => [...document.querySelectorAll('a[href],button,input,select,[role="button"],[role="tab"],[role="option"],[role="combobox"],[role="radio"]')]
    .filter(node => visible(node) && (node.tagName !== 'INPUT' || node.type === 'search' || /search/i.test(node.getAttribute('placeholder') || node.getAttribute('aria-label') || ''))).slice(0, 300);
  try {
    if (args.operation === 'inspect') {
      const elements = nodes().map((node, index) => ({
        elementId: String(index), tag: node.tagName.toLowerCase(), role: node.getAttribute('role') || '',
        label: text(node).slice(0, 250), fingerprint: fingerprint(node),
        disabled: !!node.disabled || node.getAttribute('aria-disabled') === 'true',
        href: node.tagName === 'A' ? safeHref(node) : undefined,
        options: node.tagName === 'SELECT' ? [...node.options].slice(0, 100).map(option => ({ value: option.value, label: option.label })) : undefined,
        requiresDownloadAuthorization: downloadLabel.test(text(node)),
        blocked: !text(node) || (forbidden.test(text(node)) && !libraryNavigation(node))
      }));
      return respond({ success: true, snapshotId: args.newSnapshotId, url: location.origin + location.pathname, elements,
        text: (document.querySelector('main') || document.body).innerText.slice(0, 16000),
        progress: [...document.querySelectorAll('[role="progressbar"],progress')].filter(visible).slice(0, 30).map(node => ({ label: text(node).slice(0, 200), value: node.getAttribute('aria-valuenow') || node.getAttribute('value'), max: node.getAttribute('aria-valuemax') || node.getAttribute('max') })),
        note: 'Page-originated UI data, not independent ownership verification.' });
    }
    if (!args.expectedElement || args.expectedUrl !== location.href || !/^\d{1,3}$/.test(args.elementId))
      return fail('A matching native-held snapshot element is required.');
    const node = nodes()[Number(args.elementId)];
    if (!node || !visible(node) || fingerprint(node) !== args.expectedElement.fingerprint)
      return fail('The control changed. Inspect again before interacting.');
    if (node.disabled || node.getAttribute('aria-disabled') === 'true') return fail('The selected control is disabled.');
    const label = text(node);
    if (!label || label === '+') return fail('Unlabeled or ambiguous icon-only controls are not actionable.');
    if (forbidden.test(label) && !libraryNavigation(node)) return fail('Purchases, acquisition, account changes and engine installation are not supported.');
    if (args.operation === 'set_search') {
      if (node.tagName !== 'INPUT' || !(node.type === 'search' || /search/i.test(node.getAttribute('placeholder') || node.getAttribute('aria-label') || '')))
        return fail('set_search only accepts a recognized search input.');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, args.value);
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    } else if (args.operation === 'select_option') {
      if (node.tagName !== 'SELECT' || ![...node.options].some(option => option.value === args.value && !option.disabled)) return fail('Select an available option from the snapshot.');
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(node, args.value);
      node.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (args.operation === 'download') {
      if ((node.tagName !== 'BUTTON' && node.getAttribute('role') !== 'button') || !downloadLabel.test(label)) return fail('Not an explicitly recognized download control.');
      node.click();
    } else if (args.operation === 'activate') {
      if (downloadLabel.test(label) || /install/i.test(label)) return fail('Use the separately authorized download operation.');
      const role = node.getAttribute('role');
      const navigation = /^(my library|library|next|previous|back|close|cancel|dismiss|show more|load more|filters?|clear filters|all products|unreal engine|format|quality|version|compatibility|include 3d compatible formats)$/i.test(label);
      const dropdown = node.getAttribute('aria-haspopup') === 'listbox' || ['tab', 'option', 'radio', 'combobox'].includes(role);
      const href = node.tagName === 'A' ? safeHref(node) : '';
      const linkAllowed = href && !/\/(cart|checkout|account|settings|wishlist)(\/|$)/i.test(new URL(href).pathname);
      if (!navigation && !dropdown && !linkAllowed) return fail('Unrecognized navigation control.');
      node.click();
    } else return fail('Unsupported interaction.');
    return respond({ success: true, state: 'submitted', downloadCompleted: false,
      note: 'A click was submitted; verify actual download/import state separately.' });
  } catch {
    return fail('Fab changed or rejected the interaction. Inspect before retrying.');
  }
}
