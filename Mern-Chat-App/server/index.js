const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const io = require("socket.io")(8080, {
  cors: {
    origin: "http://localhost:3000",
  },
});
// Import models
const Conversations = require("./models/Conversations/Conversations");
const Users = require("./models/Users/User");
const Message = require("./models/Messages/Messages");
// Connect to database
require("./db/connection");

const app = express();
const port = 8000;
let users = [];
const activeUsers = new Set();
io.on('connection', socket => {
  console.log('New client connected');

  socket.on('addUser', userId => {
    const isUserExist = users.find(user => user.userId === userId);
    if (!isUserExist) {
      const user = { userId, socketId: socket.id };
      users.push(user);
      io.emit("getUser", users);
    }
  });

  socket.on("sendMessage", async ({ senderId, receiverId, messages, conversationId }) => {
    const receiver = users.find(user => user.userId === receiverId);
    const sender = users.find(user => user.userId === senderId);
    const user = await Users.findById(senderId);
    if (receiver && sender) {
      io.to(receiver.socketId).to(sender.socketId).emit("getMessage", {
        senderId,
        messages,
        conversationId,
        receiverId,
        user: { id: user._id, fullName: user.fullName, emails: user.emails }
      });
    }
  });

  socket.on('disconnect', () => {
    users = users.filter(user => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });
});

// app files
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.post("/api/register", async (req, res, next) => {
  try {
    const { fullName, emails, password } = req.body;
    if (!fullName || !emails || !password) {
      res.status(400).send("Please fill up required fields");
    } else {
      const isAlreadyExist = await Users.findOne({ emails });
      if (isAlreadyExist) {
        res.status(400).send("User already exists");
      } else {
        const newUser = new Users({ fullName, emails }); // corrected syntax: parentheses instead of square brackets
        bcryptjs.hash(password, 10, (err, hashedPassword) => {
          // corrected syntax: parentheses instead of square brackets
          newUser.set("password", hashedPassword);
          newUser.save();
          next();
        });
        return res.status(200).send("User registered successfully"); // corrected typo: "Users" -> "User"
      }
    }
  } catch (error) {
    console.log("error", error);
    // Handle any potential errors here
  }
});
app.post("/api/login", async (req, res, next) => {
  try {
    const { emails, password } = req.body;
    if (!emails || !password) {
      res.status(400).send("Please fill all required fields");
    } else {
      const user = await Users.findOne({ emails });
      if (!user) {
        res.status(400).send("User email or password is incorrect");
      } else {
        const validateUser = await bcryptjs.compare(password, user.password);
        if (!validateUser) {
          res.status(400).send("User emails or password is incorrect");
        } else {
          const payload = {
            userId: user._id,
            emails: user.emails,
          };
          const JWT_SECRET_KEY =
            process.env.JWT_SECRET_KEY || "THIS_IS_JWT_SECRET_KEY";
          jwt.sign(
            payload,
            JWT_SECRET_KEY,
            { expiresIn: 84600 },
            async (err, token) => {
              await Users.updateOne(
                { _id: user._id },
                {
                  $set: { token },
                }
              );
              user.save();
              res.status(200).json({
                user: {
                  id: user._id,
                  emails: user.emails,
                  fullName: user.fullName,
                },
                token: token,
              });
            }
          );
        }
      }
    }
  } catch (error) {
    console.log(error, "error");
  }
});
app.post("/api/conversation", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const newConversation = new Conversations({
      members: [senderId, receiverId],
    });
    await newConversation.save();
    res.status(200).send("Conversation created successfully");
  } catch (error) {
    console.log("error", error);
  }
});
app.get("/api/conversations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await Conversations.find({ members: { $in: [userId]} });
    const conversationUserData = Promise.all(conversations.map(async (conversation) => {
        const receiverId =conversation.members.find((member) => member !== userId);
        const user = await Users.findById(receiverId);
        return {user: {receiverId:user._id, emails: user.emails, fullName: user.fullName },conversationId: conversation._id}
      })
    )
    console.log("conversationUserData",await conversationUserData)
    res.status(200).json(await conversationUserData);
  } catch (error) {
    console.log("error", error);
  }
})
app.post("/api/message", async (req, res) => {
  try {
    const { conversationId, senderId, messages, receiverId = "" } = req.body;
    console.log( conversationId, senderId, messages, receiverId)
    if (!senderId || !messages)
      return res.status(400).send("Please fill up required fields");
    if (conversationId ==="new"   && receiverId) {
      const newConversation = new Conversations({
        members: [senderId, receiverId],
      });
      await newConversation.save();
      const newMessage = new Message({
        conversationId: newConversation._id,
        senderId,
        message: messages,
      });
      await newMessage.save();
      return res.status(200).send("Message sent successfully");
    } else if (!conversationId && !receiverId) {
      return res.status(400).send("Please provide conversationId or receiverId");
    }
    const newMessage = new Message({ conversationId, senderId, message: messages });
    await newMessage.save();
    res.status(200).send("Message sent successfully");
  } catch (error) {
    console.log("error", error);
    res.status(500).send("An error occurred");
  }
});
app.get("/api/message/:conversationId", async (req, res) => {
  try {
    const checkMessages=async(conversationId)=>{
      console.log("conversationId",conversationId)
      const message = await Message.find({ conversationId });
      const messageUserData = Promise.all(message.map(async (message) => {
          const user = await Users.findById(message.senderId);
          return {user: {receiverId:user._id,id:user._id, emails: user.emails, fullName: user.fullName },
            message: message.message,
          };
        })
        );
        return res.status(200).json(await messageUserData)

    }
    const conversationId = req.params.conversationId;
    if (conversationId === "new") {
      const checkConversation =await Conversations.find({members:{$all:[req.query.senderId,req.query.receiverId] }})
      if(checkConversation.length>0 ){
        checkMessages(checkConversation[0]._id);
      }
      else{
        return res.status(200).json([])
      }
    }
    else{
      checkMessages(conversationId)
    }
  } catch (error) {
    console.log("error", error);
  }
});
app.get("/api/users/:userId", async (req, res) => {
  try {
    const userId=req.params.userId
    const users = await Users.find({_id:{$ne:userId}});
    const usersData = Promise.all(
      users.map(async (user) => {
        return {
          user: { emails: user.emails, fullName: user.fullName,receiverId: user._id, },
          
        };
      })
    );
    res.status(200).json(await usersData);
  } catch (error) {
    console.log("error", error);
  }
});

app.listen(port, () => console.log(`Listening on ${port}`))