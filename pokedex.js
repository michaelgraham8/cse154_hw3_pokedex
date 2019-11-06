/**
 * Michael Graham
 * 11/3/19
 * Section AL - Tal Wolman
 * HW3
 *
 * This is the JavaScript that provides interactivity to pokemon.html in order to have Pokemon
 * battles. So far, I've implemented funtions to fill the board, select discovered pokemon, and
 * display their information in the card view
 */
"use strict";
(function() {
  window.addEventListener("load", init);

  const API_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
  const MAX_MOVES = 4;

  let gameId;
  let playerId;

  /**
   * Function that initializes the pokedex by filling it with all 151 pokemon
   */
  function init() {
    fillPokedex();
    id("start-btn").addEventListener("click", startGame);
  }

  /**
   * Pulls and processes pokemon data from the Pokemon API in order to fill the Pokedex board
   */
  function fillPokedex() {
    fetch(API_URL + "pokedex.php?pokedex=all")
      .then(checkStatus)
      .then(response => response.text())
      .then(splitLines)
      .then(fillBoard)
      .catch(console.error);
  }

  function startGame() {
    showGameView();
    fetch(API_URL, {method: "POST", body: data})
      .then(checkStatus)
      .then(resp => resp.json)
      .then(processPost)
      .catch(console.error);
  }

  function showGameView() {
    id("pokedex-view").classList.toggle("hidden");
    id("p2").classList.toggle("hidden");
    getChildElement("p1", "div", 2).classList.toggle("hidden");
    id("results-container").classList.toggle("hidden");
    id("flee-btn").classList.toggle("hidden");

    for (let i = 0; i < 4; i++) {
      let button = id("p1").querySelector(".moves").querySelectorAll("button")[i];
      if(!(button.classList.contains("hidden"))) {
        button.disabled = false;
      }
    }
    qs("h1").textContent = "Pokemon Battle Mode!";
  }

  function processPost() {
    console.log("Hi");
  }

  /**
   * Splits the passed in text by line. Returns it as an array of strings
   * @param {string} text - Text that is to be split up
   * @return {array} - Array of strings consisting of the passed-in text split by line
   */
  function splitLines(text) {
    return text.split("\n");
  }

  /**
   * Uses the passed-in response object to fill the Pokedex with sprite images
   * @param {array} response - Array of strings representing the names of each pokemon
   */
  function fillBoard(response) {
    for (let i = 0; i < response.length; i++) {
      let names = response[i].split(":");
      let shortName = names[names.length - 1];

      let sprite = gen("img");
      sprite.classList.add("sprite");
      sprite.id = shortName;
      sprite.src = API_URL + "sprites/" + shortName + ".png";
      sprite.alt = shortName;
      id("pokedex-view").appendChild(sprite);
    }

    findPokemon("bulbasaur");
    findPokemon("charmander");
    findPokemon("squirtle");
  }

  /**
   * This function "discovers" the passed-in pokemon by showing it in color on the Pokedex and
   * adding an event listener for when its clicked
   * @param {string} name - Name of the pokemon that has been discovered
   */
  function findPokemon(name) {
    id(name).classList.add("found");
    id(name).addEventListener("click", function() {
      getData(name);
      id("start-btn").classList.remove("hidden");
    });
  }

  /**
   * Pulls and processed infomation on a specific pokemon from the Pokedex API
   * @param {string} name - Name of the pokemon that who's data is being fetched
   */
  function getData(name) {
    fetch(API_URL + "pokedex.php?pokemon=" + name)
      .then(checkStatus)
      .then(response => response.json())
      .then(passAlong)
      .catch(console.error);
  }

  function passAlong(response) {
    fillCard(response, "p1");
  }

  /**
   * Fills the P1 Card view with information on the selected pokemon
   * @param {Object} response - Information on the selected pokemon represented as a JSON
   * object
   */
  function fillCard(response, player) {
    qs(".name").textContent = response.name;

    qs(".pokepic").src = API_URL + response.images.photo;
    qs(".type").src = API_URL + response.images.typeIcon;
    qs(".weakness").src = API_URL + response.images.weaknessIcon;

    qs(".hp").textContent = response.hp + "HP";
    qs(".info").textContent = response.info.description;

    let movesArray = response.moves;

    for (let i = 0; i < movesArray.length; i++) {
      getChildElement(player, ".move", i).textContent = movesArray[i].name;
      id(player).querySelector(".moves")
        .querySelectorAll("img")[i].src = API_URL + "icons/" + movesArray[i].type + ".jpg";

      if ("dp" in response.moves[i]) {
        getChildElement(player, ".dp", i).textContent = movesArray[i].dp + " DP";
      } else {
        getChildElement(player, ".dp", i).textContent = "";
      }
    }

    if (movesArray.length < MAX_MOVES) {
      for (let i = 3; i >= movesArray.length; i--) {
        id(player).querySelector(".moves")
          .querySelectorAll("button")[i].classList.add("hidden");
      }
    } else {
      for (let i = 0; i < movesArray.length; i++) {
        id(player).querySelector(".moves")
          .querySelectorAll("button")[i].classList.remove("hidden");
      }
    }
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} response - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  function checkStatus(response) {
    if (!response.ok) {
      throw Error("Error in request: " + response.statusText);
    }
    return response; // a Response object
  }

  /**
   * This helper funtion generates a new DOM element
   * @param {string} tagName - DOM element that is to be created
   * @return {object} generated DOM object
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID
   * @return {object} DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  function getChildElement(parentId, tag, index) {
    let children = id(parentId).querySelectorAll(tag);
    return children[index];
  }

})();
