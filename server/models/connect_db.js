import mongoose from "mongoose";
class ConnectDB {
  static connect_DB() {
    mongoose.set("strictQuery", true);
    mongoose
      .connect("mongodb://localhost:27017/test1", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("Connected to MongoDB");
      }).catch(() => {console.log("Failed to connect to MongoDB")} );
  }
}

export default ConnectDB;
 