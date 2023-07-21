const mongoose = require("mongoose");
const url =
  "mongodb+srv://admin:admin@cluster0.ijpeo80.mongodb.net/DB1?retryWrites=true&w=majority";

mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connect to DB"))
  .catch((e) => console.log("Error", e));
