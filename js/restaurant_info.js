let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoibHVja3l4MjAwMCIsImEiOiJjamtwem5nYmIwNHI2M3BqdDI0NXFkZWg1In0.QNnIkFRfLvI2hziaqA3WIA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = "Image of the restaurant " + restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  if(!self.restaurant.reviews){
    DBHelper.fetchReviewstById(restaurant.id, (errors, reviews)=> {
      if(errors){
        console.log("Issues getting reviews...sorry");
      }else{
        self.restaurant.reviews = reviews;
        // fill reviews
        fillReviewsHTML();
      }
    })
  }else{
    // fill reviews
    fillReviewsHTML();
  }

}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  //Add Form before displaying list
  const reviewForm = document.createElement('form');
  reviewForm.id = "review-form"

  const inputLabel = document.createElement('label');
  inputLabel.innerHTML = 'Author:';
  inputLabel.setAttribute("for", "review-author");
  reviewForm.appendChild(inputLabel);

  const inputText = document.createElement('input');
  inputText.type = "text";
  inputText.id = "review-author"
  reviewForm.appendChild(inputText);

  const ratingLabel = document.createElement('label');
  ratingLabel.innerHTML = "Rating:";
  ratingLabel.setAttribute("for", "review-select");
  reviewForm.appendChild(ratingLabel);

  const ratingSelect = document.createElement('select');
  ratingSelect.id ="review-select";
  ratingSelect.name = "Rating";
  ratingSelect.setAttribute("aria-label", "Rating select");
  const rating = [1,2,3,4,5];
  rating.forEach( val => {
    let option = document.createElement('option');
    option.value = val;
    option.text = val;
    ratingSelect.appendChild(option);
  })
  reviewForm.appendChild(ratingSelect);

  const textLabel = document.createElement('label');
  textLabel.innerHTML = "Comments:"
  textLabel.setAttribute("for", "review-text");
  reviewForm.appendChild(textLabel);

  const textInput = document.createElement('textarea');
  textInput.id = "review-text"
  reviewForm.appendChild(textInput);

  const submitBtn = document.createElement('button');
  submitBtn.type = "submit";
  submitBtn.id = "review-submit"
  submitBtn.innerHTML = "Add this Review";
  submitBtn.addEventListener("click", addReview, false);
  reviewForm.appendChild(submitBtn);

  const container = document.getElementById('reviews-container');

  const reviewTitle = document.createElement('h3');
  reviewTitle.innerHTML = "Add Review";
  container.appendChild(reviewTitle);

  container.appendChild(reviewForm);

  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }else{
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  }

}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review,offline=false) => {
  const li = document.createElement('li');

  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  if(review.date){
    date.innerHTML = review.date;
  }else{
    date.innerHTML = `Date: ${new Date(review.createdAt).toLocaleString()}`;
  }
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  if(offline && !navigator.onLine){
    const offline_status = document.createElement('p');
    offline_status.classList.add('offline');
    offline_status.innerHTML = "OFFLINE";
    li.append(offline_status);
  }

  return li;
}


addReview = () => {
  event.preventDefault();
  let restarauntId = getParameterByName('id');
  let name = document.getElementById('review-author').value;
  let comments = document.getElementById('review-text').value;
  let rating = document.querySelector('#review-select option:checked').value

  const reviewData = {
    name: name,
    rating: parseInt(rating),
    comments: comments.substring(0, 300),
    restaurant_id: parseInt(restarauntId),
    createdAt: new Date()
  }

  DBHelper.postReview(reviewData)
  const reviewList = document.getElementById('reviews-list');
  const review = createReviewHTML(reviewData, true);
  reviewList.appendChild(review);
  document.getElementById('review-form').reset();


}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
