// Nitka: generowanie plansz w tle, żeby nie przycinać animacji.
importScripts('gen.js');
self.onmessage = (e) => {
  const { id, opts } = e.data;
  self.postMessage({ id, puzzle: self.NitkaGen.generate(opts) });
};
