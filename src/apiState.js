class apiState {
	constructor(parent) {
		this.parent = parent;
	}

	observe(variableName) {
		console.log("variableName", variableName)
	}

}

module.exports = exports = apiState