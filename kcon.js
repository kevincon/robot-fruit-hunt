// kconbot
// Written by Kevin Conley
// kevindconley@gmail.com
// http://kevintechnology.com

// Some parts shamelessly ripped from scribd's SimpleBot.

var kconBot = {
    makeMove: function() {

	kconBot.board = get_board();

	// we found an item! take it!
	if (has_item(kconBot.board[get_my_x()][get_my_y()])) {
		return TAKE;
	}
	   
	// looks like we'll have to keep track of what moves we've looked at
	kconBot.toConsider = new Array();
	kconBot.considered = new Array(HEIGHT);
	for (var i = 0; i < WIDTH; i++) {
		kconBot.considered[i] = new Array(HEIGHT);
		for (var j = 0; j < HEIGHT; j++) {
			kconBot.considered[i][j] = 0;
		}
	}

	var num_items = get_number_of_item_types();
	var abund_item = -1; //item type with the most items available on board
	var rare_item = -1; // item type with the least total items available overall

	for (var i = 0; i < num_items; i++) {
		var total = get_total_item_count(i);
		var mine = get_my_item_count(i);
		var theirs = get_opponent_item_count(i);
		var available = total - mine - theirs;
		
		if (available >= abund_item || abund_item == -1)
			abund_item = i;
			
		if (total <= rare_item || rare_item == -1)
			rare_item = i;
	}
	   
       // let's find the move that will start leading us to the closest item
       return kconBot.findMove(new node(get_opponent_x(), get_opponent_y(), -1));
    },

    findMove: function(n) {
       // closest item! we will go to it
       if (has_item(kconBot.board[n.x][n.y]))
           return n.move;

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
       if (kconBot.toConsider.length > 0) {
           var next = kconBot.toConsider.shift();
           return kconBot.findMove(next);
       }

       // no move found
       return -1;
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
    }
}

function node(x, y, move) {
    this.x = x;
    this.y = y;
    this.move = move;
}
