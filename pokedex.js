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
  let myPokemon;
  let opponent;
  let originalHp;

  /**
   * Function that initializes the pokedex by filling it with all 151 pokemon
   */
  function init() {
    fillPokedex();
    id("start-btn").addEventListener("click", function() {
      startGame();
    });
    id("endgame").addEventListener("click", resetGame);
    id("flee-btn").addEventListener("click", function() {
      executeMove("flee");
    })
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

    findPokemon("bulbasaur", "p1");
    findPokemon("charmander", "p1");
    findPokemon("squirtle", "p1");
  }

  /**
   * This function "discovers" the passed-in pokemon by showing it in color on the Pokedex and
   * adding an event listener for when its clicked
   * @param {string} name - Name of the pokemon that has been discovered
   */
  function findPokemon(name, player) {
    id(name).classList.add("found");
    id(name).addEventListener("click", function() {
      getData(name, "p1");
    });
  }

  /**
   * Pulls and processed infomation on a specific pokemon from the Pokedex API
   * @param {string} name - Name of the pokemon that who's data is being fetched
   */
  function getData(name, player) {
    fetch(API_URL + "pokedex.php?pokemon=" + name)
      .then(checkStatus)
      .then(response => response.json())
      .then(function(response) {
        fillCard(response, player);
      })
      .catch(console.error);
  }

  /**
   * Fills the P1 Card view with information on the selected pokemon
   * @param {Object} response - Information on the selected pokemon represented as a JSON
   * object
   */
  function fillCard(response, player) {
    id(player).querySelector(".name").textContent = response.name;
    if(player === "p1") {
      id("start-btn").classList.remove("hidden");
      myPokemon = response.shortname;
      originalHp = response.hp;
    } else {
      opponent = response.shortname;
    }


    id(player).querySelector(".pokepic").src = API_URL + response.images.photo;
    id(player).querySelector(".type").src = API_URL + response.images.typeIcon;
    id(player).querySelector(".weakness").src = API_URL + response.images.weaknessIcon;

    id(player).querySelector(".hp").textContent = response.hp + "HP";
    id(player).querySelector(".info").textContent = response.info.description;

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

  function startGame() {
    showGameView();

    let params = new FormData();
    params.append("startgame", "true");
    params.append("mypokemon", myPokemon);
    fetch(API_URL + "/game.php", {method: "POST", body: params})
      .then(checkStatus)
      .then(resp => resp.json())
      .then(processPost)
      .catch(console.error);
  }

  function showGameView() {
    id("p1-turn-results").textContent = "";
    id("p2-turn-results").textContent = "";
    id("pokedex-view").classList.toggle("hidden");
    id("p2").classList.toggle("hidden");
    getChildElement("p1", "div", 2).classList.toggle("hidden");
    id("results-container").classList.toggle("hidden");
    id("p1-turn-results").classList.toggle("hidden");
    id("p2-turn-results").classList.toggle("hidden");
    id("flee-btn").classList.toggle("hidden");
    id("start-btn").classList.add("hidden");

    let buttonArray = id("p1").querySelector(".moves").querySelectorAll("button");

    let movesArray = id("p1").querySelectorAll(".move");
    for (let i = 0; i < buttonArray.length; i++) {
      if (!(buttonArray[i].classList.contains("hidden"))) {
        buttonArray[i].disabled = false;
        let move = movesArray[i].textContent;
        buttonArray[i].addEventListener("click", function() {
          executeMove(move);
        });
      }
    }
    qs("h1").textContent = "Pokemon Battle Mode!";
    getChildElement("p1", "div", 0).classList.toggle("hidden");
  }

  function processPost(response) {
    gameId = response.guid;
    playerId = response.pid;
    let opponent = response.p2.name;
    getData(opponent, "p2");
  }

  function executeMove(move) {
    id("loading").classList.toggle("hidden");
    id("p1").querySelector(".buffs").innerHTML = "";
    id("p2").querySelector(".buffs").innerHTML = "";
    getMoveData(move);
  }

  function getMoveData(move) {
    let params = new FormData();
    params.append("guid", gameId);
    params.append("pid", playerId);
    params.append("move", move);
    fetch(API_URL + "game.php", {method: "POST", body: params})
      .then(checkStatus)
      .then(resp => resp.json())
      .then(processResponse)
      .then(function() {
        id("loading").classList.toggle("hidden");
      })
      .catch(console.error);
  }

  function processResponse(response) {
    displayResults(response);
    updateHealth(response, "p1");
    updateHealth(response, "p2");
    showBuffs(response, "p1", "buffs");
    showBuffs(response, "p2", "buffs");
    showBuffs(response, "p1", "debuffs");
    showBuffs(response, "p2", "debuffs");
  }

  function displayResults(response) {
    let p1Response = "Player 1 played " + response.results["p1-move"] + " and " + response.results["p1-result"] + "!";
    id("p1-turn-results").textContent = p1Response;

    if (response.results["p2-move"] === null || response.results["p2-result"] === null) {
      id("p2-turn-results").classList.add("hidden");
    }
    let p2Response = "Player 2 played " + response.results["p2-move"] + " and " + response.results["p2-result"] + "!";
    id("p2-turn-results").textContent = p2Response;
  }

  function updateHealth(response, player) {
    let newHealth = response[player]["current-hp"];
    id(player).querySelector(".hp").textContent = newHealth + "HP";
    let healthPct = (newHealth * 100/ response[player].hp) + '%';
    id(player).querySelector(".health-bar").style.width = healthPct;

    if (parseFloat(healthPct) < 20) {
      id(player).querySelector(".health-bar").classList.add("low-health");
    } else {
      id(player).querySelector(".health-bar").classList.remove("low-health");
    }

    if(parseFloat(healthPct) === 0) {
      endGame(player);
    }
  }

  function endGame(player) {
    if(player === "p1") {
      qs("h1").textContent = "You lost!";
    } else {
      qs("h1").textContent = "You won!";
    }
    id("endgame").classList.remove("hidden");
    id("flee-btn").classList.add("hidden");

    for(let i = 0; i < qsa(".move").length; i++) {
      qsa("div.moves > button")[i].disabled = true;
    }
  }

  function resetGame() {
    id("pokedex-view").classList.toggle("hidden");
    id("endgame").classList.toggle("hidden");
    id("results-container").classList.toggle("hidden");
    id("p2").classList.toggle("hidden");
    qs("#p1 .hp-info").classList.toggle("hidden");
    qs("#p1 .buffs").classList.toggle("hidden");
    id("start-btn").classList.add("hidden");
    getData(myPokemon, "p1");
    qs("h1").textContent = "Your Pokedex";
    qs("#p1 .health-bar").style.width = '100%';
    qs("#p1 .hp").textContent = originalHp + "HP";
    qs("#p1 .health-bar").classList.remove("low-health");

    qs("#p2 .health-bar").style.width = '100%';
    qs("#p2 .hp").textContent = originalHp + "HP";
    qs("#p2 .health-bar").classList.remove("low-health");

    if (!(id(opponent).classList.contains("found"))) {
      findPokemon(opponent);
    }
  }

  function showBuffs(response, player, array) {
    let buffArray = response[player][array];
    for (let i = 0; i < buffArray.length; i++) {
      let newBuff = gen("div");
      newBuff.classList.add(buffArray[i]);
      if(array === "buffs") {
        newBuff.classList.add("buff");
      } else {
        newBuff.classList.add("debuff");
      }
      id(player).querySelector(".buffs").appendChild(newBuff)
    }
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

  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

})();
