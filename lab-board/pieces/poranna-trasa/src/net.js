// The network for two players, each on his own computer: a direct link between the two browsers (WebRTC), no game server.
// They find each other by two codes passed by hand (a message to a friend): the host makes an offer (KOD 1), the guest pastes it
// and gets an answer (KOD 2), the host pastes that, and they are linked. Only the public STUN server is asked (which of your
// addresses the other can reach); what the game says goes straight between the two. A link that cannot be made (some office and
// mobile networks): it says so.
// For trying it on one computer: two tabs of the game with ?bc=CODE in the address talk through a BroadcastChannel instead.
// createNet({ onMsg(m), onState(s) }) → { host() → Promise<code1>, join(code1) → Promise<code2>, accept(code2), bc(code), send(m), close(),
//   get on (linked), get role ('host' | 'guest' | null), get status }

const STUN = [{ urls: 'stun:stun.l.google.com:19302' }];
const b64 = u8 => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function pack(obj) { const data = new TextEncoder().encode(JSON.stringify(obj)); if (!window.CompressionStream) return 'J' + b64(data);
  const cs = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw')); return 'Z' + b64(new Uint8Array(await new Response(cs).arrayBuffer())); }
async function unpack(code) { code = code.trim().replace(/\s+/g, ''); const k = code[0], u8 = unb64(code.slice(1)); if (k === 'J') return JSON.parse(new TextDecoder().decode(u8));
  const ds = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return JSON.parse(await new Response(ds).text()); }
// (the offer, its candidates gathered in: one code, nothing to trickle)
const gathered = pc => new Promise(res => { if (pc.iceGatheringState === 'complete') return res(); const t = setTimeout(res, 2500); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } }); });

export function createNet({ onMsg, onState } = {}) {
  let pc = null, dc = null, ch = null, role = null, status = 'off';
  const set = s => { status = s; onState?.(s); };
  function wire(c) { dc = c; dc.onopen = () => set('on'); dc.onclose = () => set('closed'); dc.onmessage = e => { try { onMsg?.(JSON.parse(e.data)); } catch { } }; }
  function fresh() { close(); pc = new RTCPeerConnection({ iceServers: STUN }); pc.onconnectionstatechange = () => { if (pc && ['failed', 'disconnected'].includes(pc.connectionState)) set(pc.connectionState === 'failed' ? 'failed' : 'lost'); }; }
  async function host() { fresh(); role = 'host'; set('offer'); wire(pc.createDataChannel('pt', { ordered: true })); await pc.setLocalDescription(await pc.createOffer()); await gathered(pc); return pack(pc.localDescription); }
  async function join(code) { fresh(); role = 'guest'; set('answer'); pc.ondatachannel = e => wire(e.channel); await pc.setRemoteDescription(await unpack(code)); await pc.setLocalDescription(await pc.createAnswer()); await gathered(pc); return pack(pc.localDescription); }
  async function accept(code) { if (!pc) return; set('linking'); await pc.setRemoteDescription(await unpack(code)); }
  // (two tabs on one computer: no WebRTC, a channel by name; the first one there is the host)
  function bc(code, asHost) { close(); role = asHost ? 'host' : 'guest'; ch = new BroadcastChannel('pt-' + code); ch.onmessage = e => { if (e.data === 'hi?') { ch.postMessage('hi!'); set('on'); return; } if (e.data === 'hi!') { set('on'); return; } onMsg?.(e.data); }; ch.postMessage('hi?'); set('linking'); }
  function send(m) { if (status !== 'on') return; if (ch) ch.postMessage(m); else if (dc?.readyState === 'open') dc.send(JSON.stringify(m)); }
  function close() { try { dc?.close(); pc?.close(); ch?.close(); } catch { } dc = pc = ch = null; role = null; if (status !== 'off') set('off'); }
  return { host, join, accept, bc, send, close, get on() { return status === 'on'; }, get role() { return role; }, get status() { return status; } };
}
