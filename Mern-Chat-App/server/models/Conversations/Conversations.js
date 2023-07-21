const mongoose = require("mongoose");

const conversationSchema = mongoose.Schema({
  members: {
    type: Array,
    required: true,
  },
});

const Conversations = mongoose.model("conversationSchema", conversationSchema);
module.exports = Conversations;
