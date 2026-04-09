import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/express";
import { Message } from "../models/Message.js";
import { Chat } from "../models/Chat.js";
import { User } from "../models/User.js";

// store online users in memory : userId -> socketId
export const onlineUsers: Map<string, string> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [
    process.env.FRONTEND_DEVELOPMENT_URL as string,
    process.env.MOBILE_DEVELOPMENT_URL as string,
    process.env.FRONTEND_PRODUCTION_URL as string,
  ].filter(Boolean) as string[];

  // It creates a Socket.IO server and attaches it to your existing HTTP server, while also controlling which websites are allowed to connect.
  // SocketServer (from Socket.IO) creates a real-time server. While httpServer represents the existing Node.js server.
  // This code adds real-time (WebSocket) support to the existing httpServer server.
  // cors sets which url to allow.
  const io = new SocketServer(httpServer, { cors: { origin: allowedOrigins } });
  // io is the Socket.IO server instance created from Socket.IO. It is the main object that controls all real-time connections on your server.
  // Once you have io you can:
  // run middleware with io.use
  // listen to connection with io.on("connection", ...)
  // send messages to all client with io.emit("messages", ...)
  // io is the main Socket.IO server object you use to manage all real-time communication between your server and clients.

  // httpServer → regular server (handles requests)
  // io → real-time manager (handles live connections)

  // verify socket connection - if the user is authenticated, we will store the user id in the socket
  // Note io.use is used to verify the socket connection
  // Note io.use is used to run middlewares before every incoming connection
  // io.use lets you run code before a socket connects, usually to check or prepare the user.
  io.use(async (socket, next) => {
    // the socket parameter represents the connecting user

    // the socket here represents the connected user
    // the handshake represents the info sent during the initial connection
    // the auth repensents the authentication data sent by the client
    const token = socket.handshake.auth.token; // this is what the user will send from the client
    if (!token) return next(new Error("Authentication error"));

    try {
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      const clerkId = session.sub;

      const user = await User.findOne({ clerkId });
      if (!user) return next(new Error("User not found"));

      socket.data.userId = user._id.toString();

      next(); // calling next() allows the user to connect. If next() is not called the user cannot connect.
    } catch (error: any) {
      next(new Error(error));
    }
  });

  // this "connection" event name is special and should be written like this
  // it is the event that is triggered when a new client(user) connects to the server
  io.on("connection", (socket) => {
    // socket represents the user who just connected
    // The socket parameter is the connection object for one specific user in Socket.IO. So socket talks to one specific user
    // Note socket talks to one specific user while io talks to the whole chat server. So io talks to all users
    // Note every time a user connects, a new socket object is created for them.
    const userId = socket.data.userId; // userId is available in socket because we added it above in the io.use

    // send list of currently online users to the newly connected client
    // socket.emit sends a message to the specific connected user.
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

    // store user in the onlineUsers map
    // Note every connected user is automatically put into a room identified as socket.id
    onlineUsers.set(userId, socket.id); // added this line

    // notify others that this current user is online
    // socket.broadcast means every one except this user
    // .emit("user-online", { userId }) sends an event called "user-online" with data {userId} so every except this user gets the message.
    socket.broadcast.emit("user-online", { userId });

    // This adds the current user’s connection (socket) to a room in Socket.IO.
    // The `user: ${userId}` creates the room/group/channel name.
    // This is  useful so that one can privately message this user latter. Rooms let you send messages to specific users or groups instead of everyone.
    // using io.to(`user: ${userId}`).emit("message", "Hello!"); we can send message to the specific user in this room. Only sockets in that room (i.e., that user) will receive the message.
    socket.join(`user: ${userId}`); // added this line

    // It listens for a request to join a chat and adds the user to a room for that specific chat, so they can receive messages from it.
    // It listens for a request from the client to join a chat room, then adds the user to that room. The frontend do something in this nature: socket.emit("join-chat", "chat123");
    // socket.on("join-chat", ...) listens for an event called "join-chat" from the client
    // Note chatId is sent from the client and it tells the server which chat to join => chat = room/channel
    // Now the server can send messages to everyone in this chat/room/channel with io.to(`chat:${chatId}`).emit("new-message", message);
    socket.on("join-chat", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    // It removes a user from a chat room when they indicate they want to leave.
    // socket.on("leave-chat", ...) listens for an event called "leave-chat" from the client. The client does something in this nature: socket.emit("leave-chat", "chat123");
    // The client sends the chatId and this tells the user which chat the client wants to leave.
    // The code removes this user’s socket from the room named chatId and the user will no longer receive messages sent to that chat room/channel
    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    // handles sending messages
    // This code handles sending a chat message in real-time.
    // When a client sends "send-message" with some text and chat ID, the server:
    // - Checks if the chat exists and the user is part of it
    // - Saves the message to the database
    // - Updates the chat’s “last message” info
    // - Sends the message to all users in that chat room and updates their chat list
    socket.on(
      // Note socket.on → “Listen for an event from this client.”, "send-message" is the event name and data → object sent by the client:
      // This function is async because it interacts with the database.

      "send-message",
      async (data: { chatId: string; text: string }) => {
        try {
          const { chatId, text } = data;

          // Checks if a chat exists with: _id: chatId and participants: userId because:
          // Only users who are in the chat can send messages.
          // If the chat doesn’t exist, we prevent invalid messages.
          const chat = await Chat.findOne({
            _id: chatId,
            participants: userId, // Checks participants includes the current userId
          });

          if (!chat) {
            // If the chat doesn’t exist or the user isn’t part of it: send an error only to this user
            socket.emit("socket-error", { message: "Chat not found" });
            return;
          }

          const message = await Message.create({
            chat: chatId,
            sender: userId,
            text,
          });

          chat.lastMessage = message._id;
          chat.lastMessageAt = new Date();
          await chat.save();

          await message.populate("sender", "name avatar");

          // emit to chat room (for users inside the chat)
          io.to(`chat:${chatId}`).emit("new-message", message);

          // The loop does this for every participant in the chat:
          // - Pick a participant (participantId)
          // - Go to that participant’s private room: user:${participantId}
          // - Send them the new message
          // Even if the participant is offline, Socket.IO will store the message in their connection if it reconnects (if using proper session management or socket reconnection)
          // Useful for chat list view, so the frontend can update previews & last message
          for (const participantId of chat.participants) {
            io.to(`user:${participantId}`).emit("new-message", message);
          }
        } catch (error) {
          socket.emit("socket-error", { message: "Failed to send message" });
        }
      },
    );

    // todo: later
    socket.on("typing", async (data) => {});

    // When a user disconnects, this code removes them from the online users list and notifies all other users that they are now offline.
    // socket.on → listens for an event from this client
    // "disconnect" → a special event automatically triggered when the user disconnects from the server Example: closes the browser, loses internet, or logs out
    // () => { ... } → function that runs when this happens
    socket.on("disconnect", () => {
      onlineUsers.delete(userId); // removes this user from the map

      // notify others
      // socket.broadcast → send a message to all other connected users except this one
      socket.broadcast.emit("user-offline", { userId });
    });
  });

  return io;
};
