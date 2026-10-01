import '@testing-library/jest-dom/vitest';
// jsdom does not implement the browser's native dialog methods.
HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};
HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new Event('close'))};
