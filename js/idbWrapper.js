class IdB {

	static get OBJECT_STORE(){
		return  "restaruantDB";
	}

	static get REVIEW_STORE(){
		return "reviewDB";
	}

	static get IDB_PROMISE(){
		return idb.open('restaraunt-db', 2, function(upgradeDb){
			switch(upgradeDb.oldVersion){
				case 0:
					upgradeDb.createObjectStore(IdB.OBJECT_STORE, {keyPath: 'id'});
				case 1:
					const keyValStore = upgradeDb.createObjectStore(IdB.REVIEW_STORE, {keyPath: 'id'});
					keyValStore.createIndex('restaurant', 'restaurant_id');
			}
		});
	}

	static storeRestaurants(restaurants){
		IdB.IDB_PROMISE
        	.then(db => IdB.setRestaurants(db, restaurants))
        	.then( () => console.log("Added restaurants to IDB"));
	}

	static setRestaurants(db, restaurants){
		let tx = db.transaction(IdB.OBJECT_STORE, 'readwrite');
		let keyValStore = tx.objectStore(IdB.OBJECT_STORE);
		restaurants.forEach( (restaurant) => {
			keyValStore.put(restaurant);
		});
		return tx.complete;
	}

	static hasRestaraunts(db){
		return IdB.IDB_PROMISE
		  .then( db => IdB.countRestaurants(db))
	}

	static countRestaurants(db){
		let tx = db.transaction(IdB.OBJECT_STORE);
		let keyValStore = tx.objectStore(IdB.OBJECT_STORE);
		return keyValStore.count();
	}

	static getRestaurants(){
		return IdB.IDB_PROMISE
		  .then( db => IdB.getAllRestaurant(db))
	}

	static getAllRestaurant(db){
		let tx = db.transaction(IdB.OBJECT_STORE);
		let keyValStore = tx.objectStore(IdB.OBJECT_STORE);
		return keyValStore.getAll();
	}

	static storeReview(reviews){
		IdB.IDB_PROMISE
		  .then(db => IdB.setReviews(db, reviews))
		  .then( () => console.log("Added reviews to IDB"));
	}

	static setReviews(db, reviews){
		let tx = db.transaction(IdB.REVIEW_STORE, 'readwrite');
		let keyValStore = tx.objectStore(IdB.REVIEW_STORE);
		reviews.forEach((review) => {
			keyValStore.put(review);
		});
		return tx.complete;
	}

	static hasReviews(id){
		return IdB.IDB_PROMISE
		  .then( db => IdB.countReviews(db, id));
	}

	static countReviews(db, id){
		let tx = db.transaction(IdB.REVIEW_STORE);
		let keyValStore = tx.objectStore(IdB.REVIEW_STORE);
		let reviewIndex = keyValStore.index('restaurant');
		return reviewIndex.count(id);
	}

	static getReviews(id){
		return IdB.IDB_PROMISE
		  .then( db => IdB.getAllReviewById(db, id));
	}

	static getAllReviewById(db, id){
		let tx = db.transaction(IdB.REVIEW_STORE);
		let keyValStore = tx.objectStore(IdB.REVIEW_STORE);
		let reviewIndex = keyValStore.index('restaurant');
		return reviewIndex.getAll(id);
	}

}