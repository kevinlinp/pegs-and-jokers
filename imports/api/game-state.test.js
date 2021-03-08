import { assert } from "chai";
import { resetDatabase } from 'meteor/xolvio:cleaner';

import { Games } from './games.js'
import { Players } from './players.js'
import GameState from './game-state.js'

if (Meteor.isServer) {
  // TODO: unfuck mocharc
  describe('GameState', function () {
    beforeEach(function () {
      resetDatabase();
    });

    it('initial state', function () {
      ({gameId, game, players, gameState} = setupGame())

      assert.lengthOf(gameState.draw, 108)
      assert.deepInclude(gameState.draw, `2 C 0`)
      assert.deepEqual(gameState.starts[3][4], {player: 3, peg: 4})
    })

    it('start', function () {
      ({gameId, game, players, gameState} = setupGame())

      gameState.start()

      assert.lengthOf(gameState.draw, 108 - (5 * 4))
      assert.lengthOf(gameState.hands[3], 5)

      gameState = new GameState(game)

      assert.lengthOf(gameState.draw, 108 - (5 * 4))
      assert.lengthOf(gameState.hands[3], 5)
    })

    describe('playCard', function () {
      it('normal card', function () {
        ({gameId, game, players, gameState} = setupGame())
        const card = 'Ja C 0'
        gameState.start([[card]])

        // const card = Array.from(gameState.hands[0])[0]
        // assert.isNotNull()

        gameState.playCard(0, card, {peg: 0})

        // TODO: dedup
        console.log(gameState.track);
        assert.deepEqual(gameState.track[8], {player: 0, peg: 0})
        assert.isNull(gameState.starts[0][0])
        assert.notDeepInclude(gameState.hands[0], card)
        assert.deepInclude(gameState.discard, card)
        assert.notDeepInclude(gameState.draw, gameState.hands[0][4])
        assert.lengthOf(gameState.hands[0], 5)
        assert.lengthOf(gameState.draw, 108 - (5 * 4) - 1)

        gameState = new GameState(game)
      })
    })
  });
}

const setupGame = function () {
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

  return {gameId, game, players, gameState}
}
