const Net = require("net");
const _ = require("lodash");
const parseString = require("xml2js").parseString;
const EventEmitter = require("events");
const util = require("util");
const c = require('ansi-colors');
const { forEach } = require("lodash");

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

			if (
        this.shortcut_states[state["$"].name] !== undefined &&
        this.shortcut_states[state["$"].name].value !== state["$"].value
      ) {
        if (this.debug) console.log(
					this.messageCount++ + "\t",
					"edit>",
          state["$"].name + ":\t",
					c.red(this.shortcut_states[state["$"].name].value),
					">",
          c.green(state["$"].value),
          "(" + state["$"].type + ")"
				);	
			} 
			else if (this.shortcut_states[state["$"].name] === undefined) {
        if (this.debug) console.log(
					this.messageCount++ + "\t",
          "new >",
          state["$"].name,
          "=",
          state["$"].value,
          "(" + state["$"].type + ")"
        );
			}
			
			const updateObject = {
        lastSender: state["$"].name,
        type: state["$"].type,
        value: state["$"].value,
			}
			
			this.emit('shortcut_state', state["$"].name, updateObject)
			this.shortcut_states[state["$"].name] = updateObject;
			
    });
  }

  incomingData(data) {
    this.emit("data", data);

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
	
	shortcutSet(key, val, type = "") {
		const msg = `<shortcut name="${key}" value="${val}" />\n`;
		console.log("sending message", msg);
		this.client.write(msg)
	}

  connect() {
    this.client = new Net.Socket();
    this.shortcut_states = {};
    this.inputBuffer = Buffer.from("");
		this.messageCount = 0;

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
      console.log("Requested an end to the TCP connection");
    });
  }
}

const tc2 = new TC("10.20.102.30");
tc2.on("data", (data) => {});
tc2.on('shortcut_state', (key, obj) => {
	//console.log("updating",key,"with object", obj);
	if (key === 'preview_tally' && obj.value === "INPUT5") {
		console.log("obj", obj.value);

		tc2.shortcutSet("main_b_row_named_input", "INPUT1")
	}
});
tc2.connect();
