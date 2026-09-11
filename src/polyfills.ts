// Array.prototype.at llegó a Safari en 15.4; esto cubre iPhones con iOS 14–15.3.
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', {
    value: function at<T>(this: T[], indice: number): T | undefined {
      let n = Math.trunc(indice) || 0;
      if (n < 0) n += this.length;
      return n < 0 || n >= this.length ? undefined : this[n];
    },
    writable: true,
    configurable: true,
  });
}

export {};
