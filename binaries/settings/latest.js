"use strict"
var relayId = Math.floor(Math.random()*3)

export default {
	hintsVersion: 1,
	container: "game_frame",
	worldsDB: "worlds",
	relays: [
		{ addr: "wss://relay.deev.is/", comment: "lax1dude relay #1", primary: relayId === 0 },
		{ addr: "wss://relay.lax1dude.net/", comment: "lax1dude relay #2", primary: relayId === 1 },
		{ addr: "wss://relay.shhnowisnottheti.me/", comment: "ayunami relay #1", primary: relayId === 2 }
	],
	checkRelaysForUpdates: false,
	servers: [
        { addr: "wss://mc.arch.lol/", name: "Arch MC" }
    ],
	allowBootMenu: false,
	enableMinceraft: true
};