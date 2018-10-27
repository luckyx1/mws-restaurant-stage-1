/**
 * Common database helper functions.
 */

/***
* Register the service worker
*/
  if(navigator.serviceWorker){
    navigator.serviceWorker
      .register('/sw2.js')
      .then(function(){
        console.log("Service Worker Registered");
      }).catch(function(err){
        console.log("Service Worker Registration failed~", err);
      });
  }else{
    console.log("Navigator has no serviceWorker");
  }

class DBHelper {


  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Review URL.
   * Change this to restaurants.json file location on your server.
   */
  static REVIEW_URL(id) {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews/?restaurant_id=${id}`;
  }

  static get REVIEW_POST(){
    const port = 1337;
    return `http://localhost:${port}/reviews/`
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(data => DBHelper.handleFetchData(data, callback))
      .catch(e => DBHelper.handleFetchError(e, callback))
  }

  static handleFetchData(restaurants, callback){
    // console.log("fetch data recieved ", restaurants);
    IdB.storeRestaurants(restaurants);
    callback(null, restaurants);
  }

  static handleFetchError(error, callback){
    console.log("no restaurant data from fetch, try Idb");
    IdB.hasRestaraunts()
      .then((count) =>{
        if(count === 0){
          callback(`Request restaurant data failed. Returned status of ${error}`, null);
        }else{
          console.log("restaurant available in cache", count);
          IdB.getRestaurants().
            then((restaurants)=>{
              callback(null, restaurants);
            })
        }
      });
  }

  /*
    Fetch all review for specific restaurant id
  */
  static fetchReviewstById(id, callback){
    fetch(DBHelper.REVIEW_URL(id))
      .then(response => response.json())
      .then(data => DBHelper.handleFetchReviewData(data, callback))
      .catch(e => DBHelper.handleFetchReviewError(e, id, callback))
  }

  static handleFetchReviewData(reviews, callback){
    // console.log("fetched reviews now store", reviews);
    IdB.storeReview(reviews);
    callback(null, reviews);
  }

  static handleFetchReviewError(error, id, callback){
    console.log("failed to get review from server, try Idb");
    IdB.hasReviews(id)
      .then((count) => {
        if(count === 0){
          callback(`Request review data failed. Returned status of ${error}`, null);
        }else{
          console.log("review available in cache", count);
          IdB.getReviews(id).
            then((reviews)=> {
              callback(null, reviews);
            })
        }
      })
  
  }

  static postReview(data){
    const POST = {
      method: 'POST',
      body: JSON.stringify(data)
    };
    return fetch(DBHelper.REVIEW_POST, POST)
      .then(response => {
        return response.json();
      })
      .then(() => {
        console.log("Server has review, generate html now");
      })
      .catch(e =>{
        console.log("Failed to post, save for later");
        DBHelper.postReviewOffline(data)
      })
  }

  static postReviewOffline(data){
    let key = Date.now();
    localStorage.setItem(key, JSON.stringify(data));
    window.addEventListener('online', (event) => {
      console.log("Browser is online again!");
      let review = JSON.parse(localStorage.getItem(key));
      if(data){
        console.log("posting b/c online now");
        let offlineClass = [document.getElementsByClassName("offline")];
        offlineClass.map((elm) => { elm[0].remove()});
        DBHelper.postReview(data);
      }
      localStorage.removeItem(key);
      console.log("cleared elm from localStorage");
    })
  }



  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    // Looks like there is no 10 value set on server so fall back to id
    if (restaurant.photograph) return (`/img/${restaurant.photograph}.jpg`);
    return (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

