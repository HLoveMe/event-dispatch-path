"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./dist/esm/event-path.prod.js");
} else {
  module.exports = require("./dist/esm/event-path.dev.js");
}
