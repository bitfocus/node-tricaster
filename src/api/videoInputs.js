const debug = require("debug")("tricaster:api:videoInputs");
const { xor } = require("lodash");

const apiState = require("../apiState");

class videoInputs extends apiState {
  constructor(...params) {
    super(...params);

		for (
      let input = 1;
      input <= this.parent.detectedCapabilities.input;
      input++
    ) {
      this.observe("input" + input + "_short_name");
			this.observe("input" + input + "_long_name");
    }
	}
}

module.exports = exports = videoInputs;
