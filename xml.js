const Net = require("net");
const _ = require("lodash");
const parseString = require("xml2js").parseString;
const EventEmitter = require("events");
const util = require("util");
const c = require('ansi-colors');

class TC extends EventEmitter {

  constructor(ip) {
    super();
		this.ip = ip;
		this.debug = true;
	}
	
  shortcutStatesIngest(states) {
    states.forEach((state) => {

			if (state["$"].name.match(/^swit45_/)) return
			if (state["$"].name.match(/^minics_/)) return
			if (state["$"].name.match(/^tcs_/)) return
			if (state["$"].name.match(/^gemini/)) return
			if (state["$"].name.match(/^strip[0-9]+_/)) return // mikserstriper, panel row assignment

			if (
        this.shortcut_states[state["$"].name] !== undefined &&
        this.shortcut_states[state["$"].name].value !== state["$"].value
      ) {
        if (this.debug) console.log(
					//this.messageCount++ + "\t",
					"edit>",
          state["$"].name + ":\t",
					c.red(this.shortcut_states[state["$"].name].value),
					">",
          //c.green(state["$"].value),
          "(" + state["$"].type + ")"
				);	
			} 
			else if (this.shortcut_states[state["$"].name] === undefined) {

				this.detectionData(state["$"].name)

				if (this.debug && this.connecting === false) console.log(
					//this.messageCount++ + "\t",
          "new >",
          state["$"].name,
          "=",
          //state["$"].value,
          "(" + state["$"].type + ")"
        );

			}
			
			const updateObject = {
        //lastSender: state["$"].name,
        type: state["$"].type,
        value: state["$"].value,
			}
			
			this.emit('variable', state["$"].name, updateObject)
			this.shortcut_states[state["$"].name] = updateObject;
			
		});

		if (this.connecting === true) {
			this.connecting = false; 
			Object.keys(this.shortcut_states).forEach(key => this.emit('variable', key, this.shortcut_states[key] ))
			this.emit('ready')
			this.keepalive = setInterval( () => { 
				if (this.connecting === false) {
					this.client.write(Buffer.from('\n'))
				}
			}, 1000)
		}

	}

  incomingData(data) {

		if (data.shortcut_states !== undefined) {
      if (Array.isArray(data.shortcut_states)) {
        data.shortcut_states.forEach((states) =>
          this.shortcutStatesIngest(states.shortcut_state)
        );
      } else {
        this.shortcutStatesIngest(data.shortcut_states.shortcut_state);
      }
    } else {
      console.log(
        "UNKNOWN INCOMING DATA",
        util.inspect(data, false, null, true)
      );
    }
  }
	
	variableSet(key, val, type = "") {
		const msg = `<shortcut name="${key}" value="${val}" />\n`;
		console.log("sending message", msg);
		this.client.write(msg)
	}

	detectionData(key) {
		const reg = new RegExp("^([^0-9]+)([0-9]*)_","i");
		let match;
		if (match = key.match(reg)) {
			const dc = Object.keys(this.detectedCapabilities);
			if (dc.indexOf(match[1]) >= 0) {
				if (this.detectedCapabilities[match[1]] === false || this.detectedCapabilities[match[1]] === true) {
					this.detectedCapabilities[match[1]] = true;
				}
				else {
					if (parseInt(match[2]) > this.detectedCapabilities[match[1]]) {
						this.detectedCapabilities[match[1]] = parseInt(match[2])
					}
				}
			} else {
				//console.log("irrelecvant", match[1])
			}
		}

	}
	close() {
		if (this.client !== undefined && this.client.close !== undefined) {
			this.client.close();
		}
		this.emit('close');
		if (this.keepalive) {
			clearInterval(this.keepalive);
		}
	}
  connect() {
    this.client = new Net.Socket();
		this.client.setTimeout(3000)
    this.inputBuffer = Buffer.from("");
		this.messageCount = 0;
		this.shortcut_states = {};
		this.connecting = true;
		this.detectedCapabilities = {
			v: 0,
			ddr: 0,
			bfr: 0,
			main_mes_dsk: 0,
			input: 0,
			mix: 0,
			out: 0,
			gfx: 0,
			stream: false,
			titles: false,
			talkback: false,
			timewarp: false,
			sound: false,
			ptz: false,
			previz: false,
			net: false,
			master: false,
			main: false,
			effects: false,
			virtualinputs: false,
			virtualinputs_dsk: 0,
			media: 0,
			aux: 0, // audio auxes
		}


    this.client.connect({ port: 5951, host: this.ip }, () => {
      this.client.write(`<register name="NTK_states"/>\n`);
    });

    this.client.on("data", (inputData) => {
      clearTimeout(this.errorTimer);

      this.inputBuffer = Buffer.concat([this.inputBuffer, inputData]);

      let results;
      if (
        (results = this.inputBuffer
          .toString()
          .match(
            /<build number="(\d+)" product="([^"]+)" session="([^"]+)" \/>/
          ))
      ) {
        if (results !== undefined && results !== null && results[0] !== null) {
					console.log("got build info", results)
					this.inputBuffer = Buffer.from(
            this.inputBuffer.toString().replace(results[0], "")
          );
        }
      }

      parseString(
        Buffer.from("<root>" + this.inputBuffer.toString() + "</root>"),
        (err, result) => {
          if (!err) {
            this.inputBuffer = Buffer.from("");
            this.incomingData(result.root);
          } else {
            this.errorTimer = setTimeout(() => {
              throw "Timeout getting a complete xml packet";
            }, 500);
          }
        }
      );
    });

    this.client.on("end", () => {
			console.log("end")
			this.emit('error', 'connection ended')
			this.close();
		});

		this.client.on("timeout", () => {
			console.log("timeout")
			this.emit('error', 'timeout')
			this.close();
		});

		this.client.on('error', (err) => {
			console.log("error",err)
			this.emit('error', err)
			this.close();
		})
	
		
  }
}

module.exports = exports = TC

