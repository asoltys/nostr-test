// inspired by jb55/nostr-js Relay socket plumbing
import ws from "ws";

export function Connection(url) {
  if (!(this instanceof Connection)) return new Connection(url);

  this.url = url;

  const me = this;
  me.onfn = {};

  init_websocket(me).catch((e) => {
    if (me.onfn.error) me.onfn.error(e);
  });

  return this;
}

Connection.prototype.send = async (data) => {
  let retry = 1000;
  while (true) {
    if (this.ws.readyState === 1) return;
    await sleep(retry);
    retry *= 1.5;
  }

  this.ws.send(JSON.stringify(data));
};

function init_websocket(me) {
  return new Promise((resolve, reject) => {
    const ws = (me.ws = new WS(me.url));

    let resolved = false;
    ws.onmessage = (m) => {
      handle_nostr_message(me, m);
      if (me.onfn.message) me.onfn.message(m);
    };
    ws.onclose = (e) => {
      if (me.onfn.close) me.onfn.close(e);
      if (me.reconnecting) return reject(new Error("close during reconnect"));
      if (!me.manualClose) reconnect(me);
    };
    ws.onerror = (e) => {
      if (me.onfn.error) me.onfn.error(e);
      if (me.reconnecting) return reject(new Error("error during reconnect"));
      reconnect(me);
    };
    ws.onopen = (e) => {
      if (me.onfn.open) me.onfn.open(e);
      console.log("OPEN")

      if (resolved) return;

      resolved = true;
      resolve(me);
    };
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reconnect(me) {
  const reconnecting = true;
  let n = 100;
  try {
    me.reconnecting = true;
    await init_websocket(me);
    me.reconnecting = false;
  } catch {
    //console.error(`error thrown during reconnect... trying again in ${n} ms`)
    await sleep(n);
    n *= 1.5;
  }
}
