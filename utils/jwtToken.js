const sendToken = (user, statusCode, res) => {
    // Create Jwt token
    const token = user.getJwtToken();

    // Options for cookie
    const options = {
		httpOnly: true,
		    
		}

		res.status(statusCode).cookie('token', token, options).json({
	        success: true,
	        token,
	        user
	    })

}

module.exports = sendToken