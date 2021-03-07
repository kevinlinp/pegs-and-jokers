import crypto from 'crypto';
import { Meteor } from 'meteor/meteor';
import _ from 'lodash'
import { ObjectID } from 'mongodb'

import { Games } from './games.js'
import { GameCards } from './game-cards.js'
import { Players } from './players.js'
import { GameActions } from './game-actions.js'

// enums would be nice 😠
const CARD_NUMBERS = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10',
  'Ja', 'Q', 'K', 'A', 'Jo'
]

const SUITS = ['C', 'D', 'H', 'S']

export default class GameState {
  constructor(game) {
    this.game = game
    this.deck = this.initializeDeck()
    this.starts = this.initializeStarts()
  }


  get players() { return Players.find({gameId: this.gameId}).fetch() }
  get numPlayers() { return this.game.numPlayers }

  start() {
    const hands = _.range(this.numPlayers).map((i) => {
      return _.range(5).map(() => {
        return this.drawCard()
      })
    })

    this.hands = hands
  }

  initializeDeck() {
    const cards = []
    const decks = _.range(this.numPlayers / 2)

    decks.forEach((deck) => {
      SUITS.forEach((suit) => {
        CARD_NUMBERS.slice(0, 13).forEach((num) => {
          cards.push({num, suit, deck})
        })
      })

      cards.push({num: CARD_NUMBERS[13], suit: 'R', deck})
      cards.push({num: CARD_NUMBERS[13], suit: 'B', deck})
    })

    return cards
  }

  initializeStarts() {
    return _.range(this.numPlayers).map((i) => {
      return _.range(5).map((j) => {
        return {player: i, peg: j}
      })
    })
  }

  randomNumbers(start, endExclusive, length) {
    const numbers = new Set()

    while (numbers.size < length) {
      numbers.add(crypto.randomInt(start, endExclusive))
    }

    return Array.from(numbers)
  }


  get lastAction() {
    return GameActions.findOne({gameId: this.gameId}, {sort: {num: -1}, limit: 1})
  }

  get currentPlayerNum() {
    if (!this.lastAction) { return 1 }
    const lastActionPlayer = Players.findOne({playerId: this.lastAction.playerId})

    return ((lastActionPlayer.num - 1 + 1) % this.numPlayers) + 1
  }

  get currentPlayer() {
    return Players.findOne({gameId: this.gameId, num: this.currentPlayerNum})
  }

  drawCard() {
    const i = crypto.randomInt(this.deck.length)
    const newDeck = [...this.deck] 
    const card = newDeck.splice(i, 1) 
    this.deck = newDeck

    return card
  }
}
