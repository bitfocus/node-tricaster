
`$ yarn add @bitfocusas/tricaster`

Example:
```
const TC = require("@bitfocusas/tricaster");

const tc2 = new TC("10.20.102.30");

tc2.on('variable', (key, obj) => {
  console.log("["+key+"]:",obj)
});

tc2.on('ready', (key, obj) => {
  console.log("ready")
});

tc2.on('error', (err) => {
  console.log("error", err)
})

tc2.on('close', () => {
  console.log("close")
})

console.log("connecting")
tc2.connect();
```
