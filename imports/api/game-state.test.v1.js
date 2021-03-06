import { assert } from "chai";
import { resetDatabase } from 'meteor/xolvio:cleaner';

import { Games } from './games.js'
import { Players } from './players.js'
import { GameCards } from './game-cards.js'
import GameState from './game-state.js'

const setupAndInitializeGame = async function () {
  const gameId = Games.insert({numPlayers: 4})
  let game = Games.findOne(gameId)

  const players = [
    {name: 'Alfa', num: 1},
    {name: 'Bravo', num: 2},
    {name: 'Charlie', num: 3},
    {name: 'Delta', num: 4},
  ]

  players.forEach((playerData) => {
    Players.insert(Object.assign({}, playerData, {gameId}))
  })

  const gameState = new GameState(game)
  await gameState.initialize()
  game = Games.findOne(gameId)

  return {gameId, game, players, gameState}
}

const assertDocumentEquality = function(a, b) {
  assert.equal(a._id.valueOf(), b._id.valueOf())
}

if (Meteor.isServer) {
  describe('GameState', function () {
    beforeEach(function () {
      resetDatabase();
    });

    it('initializes', async function () {
      ({gameId, game, players, gameState} = await setupAndInitializeGame())
      player = Players.findOne({gameId})

      // console.log(GameCards.findOne())

      assert.isNotNull(game.initializedAt)
      assert.equal(GameCards.find({gameId}).count(), 54 * 2)
      assert.equal(GameCards.find({gameId, owner: 'D'}).count(), (54 * 2) - 20)
      assert.equal(GameCards.find({gameId, owner: player._id}).count(), 5)
    })

    it('has a starting currentPlayer', async function () {
      ({gameId, game, players, gameState} = await setupAndInitializeGame())
      const player1 = Players.findOne({gameId, num: 1})
      assertDocumentEquality(gameState.currentPlayer, player1)
    })

    it('lets a player discard and undo', function () {
      gameState.discardCard(playerId, cardId)
    })
  });
}
