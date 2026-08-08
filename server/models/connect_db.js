import mongoose from "mongoose";
class ConnectDB {
  static connect_DB() {
    mongoose.set("strictQuery", true);
    mongoose
      .connect("mongodb+srv://ahmed17:medocool14@cluster0.rlkfc4g.mongodb.net/chat-app", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("Connected to MongoDB");
      }).catch(() => {console.log("Failed to connect to MongoDB")} );
  }
}

export default ConnectDB;
 