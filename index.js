import { calculateId, signId, RelayPool } from "nostr";

const coinos = "wss://nostr.coinos.io";
const relays = [coinos];

const pool = RelayPool(relays);

let privkey =
  "98d6d44f5ce77848380a89cad93a550686a8cea50fdd3da2a825a2e3c46891ba";

let event = {
  pubkey: "a5cf19020a5973571d4538a3c45e62faea258fb17256480e4ab70c4da7ac483f",
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  content: "cool",
  tags: [],
};

event.id = await calculateId(event);
event.sig = await signId(privkey, event.id);

pool.on("open", (relay) => {
  relay.subscribe("subid", { limit: 1 });

  let send = () => {
    console.log("sending", event);
    relay.send(["EVENT", event]);
  };

  // wait a second then send
  setTimeout(send, 1000);
});

pool.on("event", (relay, sub_id, ev) => {
  console.log(ev);
});
