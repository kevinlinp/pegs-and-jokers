import _, { join } from 'lodash'
import * as d3 from 'd3'

const holeRadius = 0.5
const pegRadius = holeRadius * 1.8
const holeSpacing = 2.25
const legLength = 18
const sideLength = legLength * holeSpacing

export default function drawSVG(svg, {numPlayers, playerColors}) {
  const boardCircleRadius = sideLength / (2*sinD(180 / numPlayers))
  const angleDelta = (360 / numPlayers)

  let corners = _.range(numPlayers).map((i) => {
    const circleAngle = (-1 * i * angleDelta) + (angleDelta / 2)
    return {
      x: sinD(circleAngle) * boardCircleRadius,
      y: cosD(circleAngle) * boardCircleRadius,
      corner: i
    }
  })
  console.log(corners)

  const startExits = []
  const homeEntrances = []

  let legs = corners.map((corner, i) => {
    let leg = [corner]

    const nextIndex = (i + 1) % numPlayers
    const nextCorner = corners[nextIndex]
    const dX = (nextCorner.x - corner.x) / legLength
    const dY = (nextCorner.y - corner.y) / legLength

    let currentX = corner.x
    let currentY = corner.y
  
    _.range(1, legLength).forEach((j) => {
      currentX += dX
      currentY += dY

      obj = {x: currentX, y: currentY}
      if (j == 3) {
        obj.homeEntrance = i
        homeEntrances[i] = obj
      } else if (j == 8) {
        obj.startExit = i
        startExits[i] = obj
      }
      leg.push(obj)
    })

    return leg
  })

  const track = legs.flat()
  track.forEach((hole, i) => {
    hole.pos = i
  })

  const startRelativePositions = [
    [0, -3], [-1, -2], [0, -2], [1, -2], [0, -1]
  ]
  const starts = startExits.map((startExit, i) => {
    return startRelativePositions.map((pos, j) => {
      let x = pos[0] * holeSpacing
      let y = pos[1] * holeSpacing

      const rotationAngle = -1 * angleDelta * i 
      const rotated = rotate(x, y, rotationAngle)

      x = rotated[0] + startExit.x
      y = rotated[1] + startExit.y

      return {x, y, start: i, startPos: j}
    })
  })

  const homes = homeEntrances.map((homeEntrance, i) => {
    return _.range(5).map((j) => {
      let x = 0
      let y = -1 * (j + 1) * holeSpacing
      const rotationAngle = (-1 * angleDelta * i) + 30
      const rotated = rotate(x, y, rotationAngle)

      x = rotated[0] + homeEntrance.x
      y = rotated[1] + homeEntrance.y

      return {x, y, home: i, homePos: j}
    })
  })

  console.log({legs, track, startExits, homeEntrances, starts, homes})

  const board = d3.select(svg)

  board.append('g').attr('class', 'track')
    .selectAll('circle')
    .data(track)
    .join('circle')
    .attr('r', holeRadius)
    .attr('cx', function (d) { return d.x })
    .attr('cy', function (d) { return d.y })
    .attr('fill', function (d) { return holeDarker('#FFFFFF') })

  board.append('g').attr('class', 'starts')
    .selectAll('circle')
    .data(starts.flat())
    .join('circle')
    .attr('r', holeRadius)
    .attr('cx', function (d) { return d.x })
    .attr('cy', function (d) { return d.y })
    .attr('fill', function (d) { return holeDarker(playerColors[d.start]) })

  board.append('g').attr('class', 'homes')
    .selectAll('circle')
    .data(homes.flat())
    .join('circle')
    .attr('r', holeRadius)
    .attr('cx', function (d) { return d.x })
    .attr('cy', function (d) { return d.y })
    .attr('fill', function (d) { return holeDarker(playerColors[d.home]) })
  
  const pegs = [
    {player: 0, num: 0, hole: starts[0][0]},
    {player: 0, num: 1, hole: starts[0][1]},
    {player: 0, num: 2, hole: starts[0][2]},
    {player: 0, num: 3, hole: starts[0][3]},
    {player: 0, num: 4, hole: starts[0][4]},
  ]
  
  const pegsD3 = board.append('g').attr('class', 'peg')
    .selectAll('circle')
    .data(pegs)
    .join('circle')
    .attr('r', pegRadius)
    .attr('transform', function(p) { 
      return `translate(${p.hole.x}, ${p.hole.y})`
    })
    .attr('fill', function (p) { return playerColors[p.player] })

  peg = pegsD3.filter((p) => p.player == 0 && p.num == 0)
  peg = animatePeg(board, peg, [starts[0][0], startExits[0]])
  peg = animatePeg(board, peg, [startExits[0], track[10]])
  peg = animatePeg(board, peg, [track[10], corners[1], track[20]])
}

function sinD(angle) {
  return Math.sin(angle*Math.PI/180);
}
function cosD(angle) {
  return Math.cos(angle*Math.PI/180);
}

function rotate(x, y, angle) {
  const sin = sinD(angle)
  const cos = cosD(angle)
  const nx = (cos * x) + (sin * y)
  const ny = (cos * y) - (sin * x)

  return [nx, ny]
}

function holeDarker(colorStr) {
  return d3.color(colorStr).darker(.9)
}


const movingRadiusRatio = 1.3
const removeInsertDuration = 500

function animatePeg(board, peg, holes) {
  pathLine = holes.map((hole) => [hole.x, hole.y])
  pathLine = d3.line()(pathLine)
  const path = board.append('path')
    .attr('d', pathLine)
    .attr('stroke', '#FFFFFF')
    .attr('stroke-width', 0.1)
    .attr('fill', 'none')

  return peg
    .transition()
    .attr('r', pegRadius * movingRadiusRatio)
    .duration(removeInsertDuration)
    .transition()
    .duration(1500)
    .ease(d3.easePoly.exponent(4))
    .attrTween("transform", translateAlong(path))
    .transition()
    .duration(removeInsertDuration)
    .attr('r', pegRadius)
}

// taken from https://gist.github.com/dem42/e10e933990ee662c9cbd#file-index-html-L81
// Returns an attrTween for translating along the specified path element.
function translateAlong(path) {
  const pathNode = path.node()
  var length = pathNode.getTotalLength();

  return function(d, i, a) {
    return function(t) {
      var p = pathNode.getPointAtLength(t * length);
      return "translate(" + p.x + "," + p.y + ")";
    };
  };
}