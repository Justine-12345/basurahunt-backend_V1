const AddExp = (exp, rate) => {

	const addedExp = rate * 10;
	const currentExp = exp+addedExp;
	let currentLevel

	if(currentExp > 0 && currentExp <= 200){
		currentLevel = 1
	}
	else if(currentExp >= 201 && currentExp <= 400){
		currentLevel = 2
	}
	else if(currentExp >= 401 && currentExp <= 600){
		currentLevel = 3
	}
	else if(currentExp >= 601 && currentExp <= 800){
		currentLevel = 4
	}
	else if(currentExp >= 801 && currentExp <= 1000){
		currentLevel = 5
	}

	else if(currentExp >= 1001 && currentExp <= 1300){
		currentLevel = 6
	}
	else if(currentExp >= 1301 && currentExp <= 1600){
		currentLevel = 7
	}
	
	else if(currentExp >= 1601 && currentExp <= 1900){
		currentLevel = 8
	}
	
	else if(currentExp >= 1901 && currentExp <= 2200){
		currentLevel = 9
	}
	
	else if(currentExp >= 2201 && currentExp <= 2500){
		currentLevel = 10
	}
	

	else if(currentExp >= 2501 && currentExp <= 2900){
		currentLevel = 11
	}
	else if(currentExp >= 2901 && currentExp <= 3300){
		currentLevel = 12
	}
	
	else if(currentExp >= 3301 && currentExp <= 3700){
		currentLevel = 13
	}
	
	else if(currentExp >= 3701 && currentExp <= 4100){
		currentLevel = 14
	}
	
	else if(currentExp >= 4101 && currentExp <= 4500){
		currentLevel = 15
	}


	else if(currentExp >= 4501 && currentExp <= 5000){
		currentLevel = 16
	}
	else if(currentExp >= 5001 && currentExp <= 5500){
		currentLevel = 17
	}
	
	else if(currentExp >= 5501 && currentExp <= 6000){
		currentLevel = 18
	}
	
	else if(currentExp >= 6001 && currentExp <= 6500){
		currentLevel = 19
	}
	
	else if(currentExp > 6501 && currentExp <= 7000){
		currentLevel = 20
	}
	
	
	
	return [currentExp, currentLevel, addedExp];



}

module.exports = AddExp