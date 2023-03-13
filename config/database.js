const mongoose = require('mongoose');

const connectDatabase = () => {
	console.log("DB", process.env.DB_LOCAL_URI)
	mongoose.connect(process.env.DB_LOCAL_URI,{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}).then(con => {
		console.log(`MongoDB Database connected woth Host: ${con.connection.host}`)
	})
}

module.exports = connectDatabase