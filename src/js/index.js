import Search from "./models/Search";
import Recipe from "./models/Recipies";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";


import {
  elements,
  renderLoader,
  clearLoader
} from "./views/base";


/*
 *Global state
 *search object
 *current recipe object
 *shopping list object
 *liked recipes
 */

const state = {};

/*Search Controller*/
const controlSearch = async () => {

  //1) Get query from view
  const query = searchView.getInput();
  console.log(query);

  if (query) {
    //2) new search object
    state.search = new Search(query);
  }

  //3)Prepare UI for results
  searchView.clearInput();
  searchView.clearResults();
  renderLoader(elements.searchRes);

  //4)get the results
  try {
    await state.search.getResults();

    //5)Render results on UI
    clearLoader();
    if (state.search.result) searchView.renderResults(state.search.result);
  } catch (error) {
    alert("Something wrong with the search!!");
    clearLoader();
  }
};

elements.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});




elements.searchResPages.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");

  if (btn) {
    const goToPage = parseInt(btn.dataset.goto);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/*Recipe Controller*/

const controlRecipe = async () => {
  const id = window.location.hash.replace('#', '');


  if (id) {

    //Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    //Highlight Selected search
    if (state.search)
      searchView.highlightSelected(id);

    //Create new recipie object
    state.recipe = new Recipe(id);


    try {
      //Get recipe data and parse Ingredients
      await state.recipe.getRecipe()
      state.recipe.parseIngredients();

      //Calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //Render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

    } catch (error) {
      alert("Error!!");
    }
  }

};

// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener("load", controlRecipe);

["hashchange", "load"].forEach(event => window.addEventListener(event, controlRecipe));




/*List Controller*/

const controlList = () => {

  //Create new List if not yet
  if (!state.list) {
    state.list = new List();

  }

  //Add each ingredient to list
  state.recipe.ingredients.forEach((el) => {

    const item = state.list.addItem(el.count, el.unit, el.ingredient)
    listView.renderItem(item);
  })
}

//Handling delete and update List item events
elements.shopping.addEventListener('click', (e) => {

  const id = e.target.closest('.shopping__item').dataset.itemid;

  //Handle delete button
  if (e.target.matches('.shopping__delete,.shopping__delete *')) {


    //Delete from state
    state.list.deleteItem(id);

    //Delete from UI
    listView.deleteItem(id);

  } else if (e.target.matches('.shopping__count-value')) {

    const val = parseFloat(e.target.value)
    state.list.updateCount(id, val);

  }
})

/** 
 * LIKE CONTROLLER
 */




const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  // User has NOT yet liked current recipe
  if (!state.likes.isLiked(currentID)) {
    // Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    // Toggle the like button
    likesView.toggleLikedBtn(true);



    // Add like to UI list
    likesView.renderLike(newLike);


    // User HAS liked current recipe
  } else {
    // Remove like from the state
    state.likes.deleteLike(currentID);

    // Toggle the like button
    likesView.toggleLikedBtn(false);


    // Remove like from UI list
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikesMenu(state.likes.getNumLikes());
}


//Restore Like Recipes on page loads
window.addEventListener('load', () => {

  state.likes = new Likes();

  //Restore Likes
  state.likes.readStorage();

  //Toggle Like menu button
  likesView.toggleLikesMenu(state.likes.getNumLikes());

  //Render existing Likes
  state.likes.likes.forEach(like => {
    likesView.renderLike(like);

  })
})

















//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {

  if (e.target.matches('.btn-decrease,.btn-decrease *')) {
    //Decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }

  } else if (e.target.matches('.btn-increase,.btn-increase *')) {
    //Increase button is clicked
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);

  } else if (e.target.matches('.recipe__btn, .recipe__btn--add *')) {
    controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    //Like controller
    controlLike();
  }

})