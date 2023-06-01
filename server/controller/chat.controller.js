import chats from "../models/chat.model.js";
export const postMessage = async (req, res) => {
  try {
    let { sender, recieve, message } = req.body;
    const newMessage = new chats({
      message: {
        text: message,
      },
      users: [sender, recieve],
      sender: sender,
    });
    await newMessage.save();

    return res.json({ status: true });
  } catch (er) {
    console.log(er);
    res.status(403).json("some error happened when server is working ");
  }
};
export const getMessages = async (req, res) => {
  try {
    let { sender, recieve } = req.params;

    const getMessage = await chats
      .find({
        users: {
          $all: [sender, recieve],
        },
      })
      .sort({ updatedAt: 1 });
    const messageSender = getMessage.map((mes) => {
      return { message: mes.message.text, sender: mes.sender }; 
    });

    return res.json({ status: true, getMessage, messageSender });
  } catch (err) {
    console.error(err);
    res.send(err.message);
  }
};
