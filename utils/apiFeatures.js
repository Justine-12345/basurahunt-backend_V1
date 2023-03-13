class APIFeatures{
	constructor(query, queryStr){
		this.query = query;
		this.queryStr = queryStr;
		this.query2
	}

	search(){
		const keyword = this.queryStr.keyword ? {
				
			$or:
			[
			{complete_address:{
				$regex:this.queryStr.keyword,
				$options: 'i'
			}},
			{'waste_type.type':{
				$regex:this.queryStr.keyword,
				$options: 'i'
			}},
			{additional_desciption:{
				$regex:this.queryStr.keyword,
				$options: 'i'
			}},
			]


		} : {};


		this.query = this.query.find({...keyword});
		return this;

	}


	filter(){
		const queryCopy = {...this.queryStr};
		
		
		//Removing fields from the query
		const removedFields = ['keyword', 'limit', 'page']
		removedFields.forEach(el => delete queryCopy[el]);

		//Advance filter for price, rating etc
		let queryStr = JSON.stringify(queryCopy);
		// console.log("query",queryStr);
		queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`)

		// console.log(JSON.parse(queryStr));
		this.query = this.query.find(JSON.parse(queryStr));
		return this;

	}


	pagination(resPerPage){
		const currentPath = Number(this.queryStr.page) || 1;
		const skip = resPerPage * (currentPath - 1)
		this.query = this.query.limit(resPerPage).skip(skip)
		this.query = this.query
		return this;
	}



}

module.exports = APIFeatures