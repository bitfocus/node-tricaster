const WebSocket = require('ws')

class Tricaster {
	constructor() {
		this.ws = new WebSocket('ws://10.20.102.30/v1/change_notifications')
		this.ws.on('message', (msg) => {
			console.log("msg:", msg)
		})
		this.ws.on('error', (err) => {
			console.log("err:", err)
		})
	}
}

let tc = new Tricaster();
