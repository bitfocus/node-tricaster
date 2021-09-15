const TC = require("./index");

const tc2 = new TC("10.40.222.198");

tc2.on('variable', (key, obj) => {
	console.log("["+key+"]:",obj)
});

tc2.on('ready', (states, detectedCapabilities) => {
	console.log("ready", detectedCapabilities)
});

tc2.on('state', (newState,prevState) => {
	console.log("state", newState, prevState)
})

tc2.on('error', (err) => {
	console.log("error", err)
})

tc2.on('close', () => {
	console.log("close")
})

console.log("connecting")
tc2.connect();

