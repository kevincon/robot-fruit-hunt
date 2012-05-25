// kconbot
// Written by Kevin Conley
// kevindconley@gmail.com
// http://kevintechnology.com

// Some parts shamelessly ripped from scribd's SimpleBot.
var directions = [NORTH, SOUTH, EAST, WEST];
var prevx;
var prevy;

var kconBot = {
  makeMove: function() {
    var i;

  	kconBot.board = get_board();

  	var num_items = get_number_of_item_types();

    var rare = 0; // total number of items for rarest item type
    var abund = 0; // number of items for most abudant item type
  	var abund_item = -1; //item type with the most items available on board
  	var rare_item = -1; // item type with the least total items available overall

    var total = new Array();
    var mine = new Array();
    var theirs = new Array();
    var available = new Array();

  	for (i = 1; i <= num_items; i++) {
  		total[i] = get_total_item_count(i);
  		mine[i] = get_my_item_count(i);
  		theirs[i] = get_opponent_item_count(i);
  		available[i] = total[i] - mine[i] - theirs[i];
  		
      trace("item " + i + " - total: " + total[i] + " available: " + available[i]);

      // we only care if num items available is more than what opponent has 
  		if ((available[i] >= abund && (mine[i] <= theirs[i]) && (available[i] + mine[i] > theirs[i]))) { // || abund_item == -1) {
  		  abund = available[i];
        abund_item = i;
      }
  	 
  		if ((total[i] <= rare && (mine[i] <= theirs[i]) && (available[i] + mine[i] > theirs[i])) || rare_item == -1) {
  			if (available[i] > 0) {
          rare = total[i];
          rare_item = i;
        }
      }
  	}

    trace("abundant: " + abund_item + " rare: " + rare_item);

    // we're on an item, but should we take it?
    var spot_value = kconBot.board[get_my_x()][get_my_y()];
    if (has_item(spot_value)) {
      if (spot_value == abund_item || spot_value == rare_item)
        return TAKE;
    }

    // dirs will hold the value associated with each direction
    var dirs = new Object();
    dirs[NORTH] = 0;
    dirs[SOUTH] = 0;
    dirs[WEST] = 0;
    dirs[EAST] = 0;

    // find the move that will start leading us to the closest item of each type
    for (i = 1; i <= num_items; i++) {
      // ignore items that are no longer on the board
      if (available[i] == 0)
        continue;

      // looks like we'll have to keep track of what moves we've looked at
      kconBot.toConsider = new Array();
      kconBot.considered = new Array(HEIGHT);
      for (var j = 0; j < WIDTH; j++) {
        kconBot.considered[j] = new Array(HEIGHT);
        for (var k = 0; k < HEIGHT; k++) {
          kconBot.considered[j][k] = 0;
        }
      }

      // find out what direction will get us moving in the direction of this item
      var result = kconBot.findMove(new node(get_my_x(), get_my_y(), -1), i);
      //trace("result: " + result);

      // compute values accordingly for this direction
      // slightly less value for things further away
      if (result != false) {
        if (i == abund_item)
          dirs[result[0]] += 2 + (1 / result[1]);
        if (i == rare_item) 
          dirs[result[0]] += 3 + (1 / result[1]); // slightly more value for a rare item
        //dirs[result[0]] += 1 + (1 / result[1]);
      }
    }

    // determine the direction with the maximum value
    var max = 0;
    var max_direction = PASS;
    //var alternate = EAST;
    for (d in directions) {
      trace("direction: " + directions[d] + " result: " + dirs[directions[d]]);
      if(dirs[directions[d]] >= max) {
        max = dirs[directions[d]];
        //alternate = max_direction;
        max_direction = directions[d];
      }
    }

    //trace("max direction: " + max_direction);
    var potentialMove = kconBot.getCoordinatesFromDirection(max_direction);
    trace("newx: " + potentialMove[0] + " newy: " + potentialMove[1]);
    trace("oldx: " + prevx + " oldy: " + prevy);
    // use alternate if we visited this spot last turn (prevent oscillating)
    // ignore if we're one away from the edge (it's okay to back off an edge the same way we came)
    if (prevx == potentialMove[0] && prevy == potentialMove[1] && prevx != 1 && prevx != WIDTH - 2 && prevy != 1 && prevy != HEIGHT - 2) {
      trace("altx: " + potentialMove[0] + " alty: " + potentialMove[1]);
      prevx = get_my_x();
      prevy = get_my_y();
      //return alternate;
    } else {
      prevx = get_my_x();
      prevy = get_my_y();
    }

    return max_direction;
  },

  // Returns an array of size 2 where:
  // first element is the direction to get to closest item
  // second element is the distance to the closest item
  findMove: function(n, t) {
    // closest item of type t! return it
    //trace("x: " + n.x + " y: " + n.y + " - hasItem: " + has_item(kconBot.board[n.x][n.y]));
    if (kconBot.board[n.x][n.y] == t)
      return new Array(n.move, kconBot.manhattanDistance(n.x, n.y));

    var possibleMove = n.move;

    // NORTH
    if (kconBot.considerMove(n.x, n.y-1)) {
      if (n.move == -1) {
        possibleMove = NORTH;
      } 
      kconBot.toConsider.push(new node(n.x, n.y-1, possibleMove));
    } 

    // SOUTH
    if (kconBot.considerMove(n.x, n.y+1)) {
      if (n.move == -1) {
        possibleMove = SOUTH;
      } 
      kconBot.toConsider.push(new node(n.x, n.y+1, possibleMove));
    } 

    // WEST
    if (kconBot.considerMove(n.x-1, n.y)) {
      if (n.move == -1) {
        possibleMove = WEST;
      } 
      kconBot.toConsider.push(new node(n.x-1, n.y, possibleMove));
    } 

    // EAST 
    if (kconBot.considerMove(n.x+1, n.y)) {
      if (n.move == -1) {
        possibleMove = EAST;
      } 
      kconBot.toConsider.push(new node(n.x+1, n.y, possibleMove));
    } 

    // take next node to bloom out from
    //trace("toconsider length: " + kconBot.toConsider.length);
    if (kconBot.toConsider.length > 0) {
      var next = kconBot.toConsider.shift();
      return kconBot.findMove(next, t);
    }

    // no move found
    return false;
  },

  considerMove: function(x, y) {
    if (!kconBot.isValidMove(x, y)) return false;
    if (kconBot.considered[x][y] > 0) return false;
    kconBot.considered[x][y] = 1;
    return true;
  },

  isValidMove: function(x, y) {
    if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT)
      return false;
    return true;
  },

  // Plug in a direction, get the coordinates you'd be at if you
  // take that direction
  getCoordinatesFromDirection: function(dir) {
    var newx = get_my_x();
    var newy = get_my_y();

    switch(dir) {
      case NORTH:
        newy--;
        break;
      case SOUTH:
        newy++;
        break;
      case EAST:
        newx++;
        break;
      case WEST:
        newx--;
        break;
    }
    if (!kconBot.isValidMove(newx, newy))
      return new Array(get_my_x(), get_my_y());
    else
      return new Array(newx, newy);
  },

  // Returns the manhattan distance from current position
  // to the position in question
  manhattanDistance: function(x, y) {
    return Math.abs(get_my_x() - x) + Math.abs(get_my_y() - y);
  }

}

function node(x, y, move) {
  this.x = x;
  this.y = y;
  this.move = move;
}


function new_game() {

}

function make_move() {
  return kconBot.makeMove();
}