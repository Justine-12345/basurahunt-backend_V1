const app = require('./app');
const connectDatabase = require('./config/database')
const cloudinary = require('cloudinary')
const path = require('path')
const dotenv = require('dotenv');
const http = require("http");
// const { Server } = require("socket.io");


dotenv.config({path:'./config/config.env'})

// if (process.env.NODE_ENV !== 'PRODUCTION') 
//     require('dotenv').config({ path: 'backend/config/config.env' })


// process.on('uncaughtException', err => {
// 	console.log(`ERROR: ${err.stack}`);
// 	console.log('Shutting down due to uncaught exception');
// 	process.exit(1)
// })
connectDatabase();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const server = app.listen(process.env.PORT, ()=>{
  console.log(`server started on port:' ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
});


//FOR LOCAL******
// const serverForSocket = http.createServer(app);
// const io = new Server(serverForSocket, {
//   cors: {
//     origin: "http://127.0.0.1:3000",
//     methods: ["GET", "POST"],
//   },
// });

//FOR DEPLOYMENT******
// const io = new Server(server, {
//   cors: {
//     origin: "https://basurahunt.herokuapp.com/",
//     methods: ["GET", "POST"],
//   },
// });



// io.on("connection", (socket) => {
//   console.log(`User Connected: ${socket.id}`);
//   // socket.disconnect()
//   socket.on("join_room", (data) => {
//     socket.join(data);
//     console.log(`User with ID: ${socket.id} joined room: ${data}`);
//   });

//   socket.on("send_message", (data) => {
//     console.log(data)
//     socket.to(data.room).emit("receive_message", data);
//   });


//   socket.on("disconnect", () => {
//     console.log("User Disconnected", socket.id);
//   });
// });




//FOR LOCAL ******
// serverForSocket.listen(3001, () => {
//   console.log("SOCKET IS SERVER RUNNING");
// });






process.on('unhandledRejection', err => {
	console.log(`error:, ${err.stack}`);
	console.log(('shutting down this .serve due to unhandled promise rejection'))

	server.close(() => {
		process.exit(1)
	})

})