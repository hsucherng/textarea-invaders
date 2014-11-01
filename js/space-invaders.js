$(function() {
	init();
});

function init() {
	$(window).keydown(function(e) {
		if(e.keyCode == 13) {
			$(window).off('keydown');
			initStart();
		} 
	});
}

function initStart() {
	$(window).bind({
		keydown : function(e) {
			if(e.keyCode == 32) {
				if(!shot) { shoot(); }
			} else if(e.keyCode == 37) {
				playerDirection = 'left';
			} else if(e.keyCode == 39) {
				playerDirection = 'right';
			} else if(e.keyCode == 16) {
				playerSpeed = 'fast';
			} /** else if(e.keyCode == 13) { 	// Press enter again to stop the game.
				stopGame('none');
			} **/
		},
		keyup : function(e) {
			if(e.keyCode == 37 || e.keyCode == 39) {
				playerDirection = 'none';
			} else if(e.keyCode == 16) {
				playerSpeed = 'normal';
			}
		}
	});
	
	refreshCanvas('game-start');
}

var width = 100,
	height = 36,
	canvas = $('#gameCanvas'),
	titleScreen = canvas.val().split('\n'),
	gameOverScreen = $('#gameOver').val().split('\n'),
	gameInterval,
	score = 0,

	playerX = 5,
	playerUpperStr =  '_/^\\_',
	playerLowerStr = '|_____|',
	playerUpperDeathStr = '*   *',
	playerLowerDeathStr = '*  *  *',
	playerUpperWidth = 5,
	playerLowerWidth = 7,
	playerDirection = 'none',
	playerSpeed = 'normal',
	playerDead = false,
	playerLives = 0,
	
	shot = true,
	shotX = playerX + 3,
	shotY = height - 4,
	
	alienX = 5,
	alienY = 3,
	alienXLimit = width - 70,
	alienStartingY = 3,
	alienDirection = 'right',
	aliens = [
		1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 1,	1, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 1,	1, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 1, 1
	],
	alienArray = aliens.slice(0),
	alienRow = 7,
	alienColumn = 8,
	alienStr1 = [' (v"v) ', ' (;";) '],
	alienStr2 = ['\\(\'-\')/', '/(\'-\')\\'],
	alienStr3 = ['(==V==)', '(==A==)'],
	alienStrNum = 0,
	alienWidth = 7,
	alienShot = false,
	alienShotX = 10,
	alienShotY = 10,
	alienSpeed = 800,
	alienTimeout,
	alienScore = 50,
	
	bonus = false,
	bonusX = 0,
	bonusUpperStr = ['  _O_  ', '  _0_  '],
	bonusLowerStr = ['_/o_o\\_', '_/_o_\\_'],
	bonusUpperDeathStr = ' *   * ',
	bonusLowerDeathStr = '*  *  *',
	bonusStrNum = 0,
	bonusWidth = 7,
	bonusSpeed = 0.5,
	bonusScore = 300,
	
	deathStr = '+ *.* +',
	 
	bunker = [
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1,
		1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
		1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1
	],
	bunker1 = bunker.slice(0),
	bunker2 = bunker.slice(0),
	bunker3 = bunker.slice(0),
	bunker4 = bunker.slice(0),
	bunkerArray = [bunker1, bunker2, bunker3, bunker4],
	bunkerX = 9,
	bunkerWidth = 13,
	bunkerGutter = 10,
	
	// Variables with _ in front of them
	// are related to sound
	_playerShoot = $('#SFXplayerShoot').get(0),
	_playerHit = $('#SFXplayerHit').get(0),
	_alienHit = $('#SFXalienHit').get(0),
	_bonusShip = $('#SFXbonusShip').get(0),
	_bonusHit = $('#SFXbonusHit').get(0);
	
function initGame() {
	shot = false;

	gameInterval = setInterval(function() {
		var canvasStr = '';
		
		// Check if player is alive
		if(playerDead) {
			stopGame('lost-life');
			_playerHit.play();
		}
		
		// Check if all aliens have been killed
		if(alienArray.length <= 1 && alienArray[0] == 0) { stopGame('WIN!'); }
		
		// Check if bonus alien has appeared
		if(!bonus) {
			/* Hasn't appeared; roll a random number to determine 
			 * whether the bonus alien should appear or not.
			 *
			 * Math.random()*200 spans about 200 numbers.
			 * 1/200 chance roughly equals 0.5% chance of success.
			 * The gameInterval runs at 50ms, meaning it runs 20 times per second.
			 * Thus, overall chance for the bonus alien to appear is
			 * 0.5% * 20 = 10% per second. */
			var num = Math.round(Math.random()*200);
			
			// If it rolls a 0, make the ship appear. Play its sound.
			if(num == 0) { bonus = true; _bonusShip.play(); }
		}
		
		// Check if player is moving left/right
		if(playerDirection == 'left' && playerX > 0) {
			if(playerSpeed == 'fast') {
				playerX-=2;
			} else {
				playerX--;
			}
		} else if(playerDirection == 'right' && playerX < width - playerLowerWidth) {
			if(playerSpeed == 'fast') {
				playerX+=2;
			} else {
				playerX++;
			}
		}
		
		// Vertical row looping
		for(var i=0; i < height-2; i++) {
			// Check if bonus alien should appear
			if(i == 0 && bonus) {
				(bonusStrNum == 0) ? bonusStrNum = 1: bonusStrNum = 0;
				canvasStr += setBonus();
				i++;
			// Check position of aliens
			} else if(i == alienY) {
				// Match. Render the aliens.
				var a = setAlien(i),
					alienStr = a[0],
					rowsTaken = a[1];
				
				canvasStr += alienStr;
				i += rowsTaken;
				
				// If alien reaches the last two rows, means it has conquered the base.
				// And when the base is conquered, it means... GAME OVER!
				if(alienY >= height - rowsTaken - 2) {
					playerDead = true;
					playerLives = -1;
					_playerHit.play();
					stopGame('LOSE!');
					break;
				}
			} else if(i == height - 9 && alienY < height - rowsTaken - 9) {
				// Bunker renderer.
				canvasStr += setBunker(i);
				i += 4;
			} else if(i == height - 3) {
				// 3rd last row is the row right above the player.
				// Mark it with dots to show that if the alien passes
				// this row, the game will be over.
				for(var j=0; j < width; j++) { 
					// 4 dots on the left, and 4 dots on the right.
					if(j < 4 || j > width - 5) {
						canvasStr += setFiller(j, i, '.');
					} else {
						canvasStr += setFiller(j, i, ' ');
					}
				} 
			} else {
				// Horizontal column looping
				for(var j=0; j < width; j++) { 
					canvasStr += setFiller(j, i, ' ');
				} 
				canvasStr +=  '\n';
			}
		} // End vertical looping
		
		canvasStr +=  '\n';
		
		if(shot && shotY > 0) { 
			shotY -= 2;
		} else if(shot && shotY <= 0) {
			shot = false;
		}
		
		if(alienShot && alienShotY < height) {
			alienShotY += 1;
		} else if(alienShot && alienShotY >= height) {
			alienShot = false;
		}
		
		canvasStr += setPlayer();
		canvasStr += setFooter();
		
		canvas.val(canvasStr);
	}, 50);
	
	//	Self-executing timeout to move the aliens. Used this instead of setInterval
	//	so that I can adjust the speed of the timeout as the player progresses. 
	function moveAliens() {
		findColumnLimit();
		
		alienTimeout = setTimeout(function() {
			if(alienX >= alienXLimit && alienDirection == 'right') {
				alienY += 2;
				alienDirection = 'left';
			} else if(alienX <= 1 && alienDirection == 'left') {
				alienY += 2;
				alienDirection = 'right';
			} else if(alienDirection == 'right') {
				alienX++;
			} else if(alienDirection == 'left') {
				alienX--;
			}
			
			(alienStrNum == 0) ? alienStrNum = 1 : alienStrNum = 0;
			
			if(!alienShot) { alienShoot(); }
			
			moveAliens();
		}, alienSpeed);
	}
	moveAliens();
}

function setPlayer() {
	var playerStr = '',
		upperLeftSpace = playerX + 1,
		lowerLeftSpace = playerX;
	
	for(var i=0; i < width; i++) {
		if(i < upperLeftSpace) {
			if(alienShot && alienShotY == height-2 && i == alienShotX) {
				playerStr += '[';
			} else if(alienShot && alienShotY == height-3 && i == alienShotX) {
				playerStr += ']';
			} else {
				playerStr += ' ';
			}
		} else if(i == upperLeftSpace) {
			if(	playerDead ||
				alienShotY == height-2 && alienShotX >= i && alienShotX <= i+playerUpperWidth ) {
					playerDead = true;
					alienShot = false;
					playerStr += playerUpperDeathStr;
			} else {
				playerStr += playerUpperStr;
			}
			i += playerUpperWidth;
		} else if(i > upperLeftSpace) {
			if(alienShot && alienShotY == height-2 && i-1 == alienShotX) {
				playerStr += '[';
			} else if(alienShot && alienShotY == height-3 && i-1 == alienShotX) {
				playerStr += ']';
			} else {
				playerStr += ' ';
			}
		}
	}
	
	playerStr += '\n';
	
	for(var j=0; j < width; j++) {
		if(j < lowerLeftSpace) {
			if(alienShot && alienShotY == height-1 && j == alienShotX) {
				playerStr += '[';
			} else if(alienShot && alienShotY == height-2 && j == alienShotX) {
				playerStr += ']';
			} else {
				playerStr += ' ';
			}
		} else if(j == lowerLeftSpace) {
			if(	playerDead ||
				alienShotY == 39 && alienShotX >= j && alienShotX <= j+playerLowerWidth ||
				alienShotY == 38 && alienShotX >= j && alienShotX <= j+playerLowerWidth) {
					playerDead = true;
					alienShot = false;
					alienShotY = 0;
					playerStr += playerLowerDeathStr;
			} else {
				playerStr += playerLowerStr;
			}
			j += playerLowerWidth;
		} else if(j > lowerLeftSpace) {
			if(alienShot && alienShotY == height-1 && j-1 == alienShotX) {
				playerStr += '[';
			} else if(alienShot && alienShotY == height-2 && j-1 == alienShotX) {
				playerStr += ']';
			} else {
				playerStr += ' ';
			}
		}
	}
	
	return playerStr;
}

function setAlien(yPos) {
	var alienStr = '',
		alienRowNum = 0,
		rowsTaken = 1;
	
	// Start vertical row loop
	for(var i=0; i < (alienRow*2); i++) {
		// Start horizontal column loop
		for(var j=0; j < width; j++) {
			// Check if column position == starting X position of the aliens
			if(j == alienX) {
				// Yes it is equal, so start alien loop
				for(var k=alienRowNum*alienColumn; k < (alienRowNum+1)*alienColumn; k++) {
					// Check if alien is alive
					if(alienArray[k] == 1) {
						// Alien is alive. Now check if player is shooting
						if(shot) {
							// Player is shooting, so check for collision.
							// Start by checking the vertical position of the shot
							if(yPos+i == shotY || yPos+i == shotY + 1) {
								// Vertical position is in range, proceed to
								// check the horizontal position of the shot
								if(shotX > j && shotX < j + alienWidth) {
									// Horizontal position also in range, therefore
									// shot is hitting the alien. Make it DIEEE
									score += alienScore;
									alienStr += deathStr + ' ';
									alienArray[k] = 0;
									shot = false;
									_alienHit.play();
									
									// If it's the last alien being hit, end the game
									if(alienArray.length <= 1 && alienArray[0] == 0) {
										stopGame('WIN!');
										
										/** console.log("FINAL alienColumn: " + alienColumn);
										console.log("FINAL alienRow: " + alienRow);
										console.log("FINAL alienArray: " + alienArray); **/
									} else {
									// Otherwise, increase the alien's movement speed.
										alienSpeed -= 14.32;
									}
								} else {
									// Horizontal position is not in range, therefore
									// shot is not hitting the alien. Proceed as normal.
									alienStr += getAlienStr(alienRowNum);
								}
							} else {
								// Vertical position is not in range, therefore
								// shot is not hitting the alien. Proceed as normal.
								alienStr += getAlienStr(alienRowNum);
							}
						} else {
							// Player is not shooting, therefore proceed as normal.
							alienStr += getAlienStr(alienRowNum);
						}
					} else {
						// Alien is not alive. Replace it with filler.
						for(var a=0; a < 8; a++) {
							alienStr += setFiller(j+a, yPos+i, ' ');
						}
					}
					
					j += alienWidth + 1;
					
					if(k >= (alienRowNum+1)*alienColumn-1) {
						j--;
					}
				}
			} else {
				// No, it is not equal to the starting X position of the aliens
				// So, render with the filler characters instead.
				alienStr += setFiller(j, yPos+i, ' ');
				
				// Check if we've reached the end of the row
				if(j >= width - 1) {
					// Yes, we've reached the end. So add a line break.
					alienStr += '\n';
					
					// The next row will be blank, so start a loop for it.
					for(var b=0; b < width; b++) {
						// Detect if player is shooting; if yes, check position of the shot,
						// and render if the position matches
						alienStr += setFiller(b, yPos+i, ' ');
						
						// See if we've reached the end of the blank row
						if(b >= width - 1) {
							// Yes we have, so add another line break.
							alienStr += '\n';
							
							i++;
							alienRowNum++;
						}
					}
				}
			}
		}
		
		if(i >= alienRow*2-1) {
			rowsTaken = i;
		}
	}
	
	return [alienStr, rowsTaken];
}

function getAlienStr(num) {
	if(num < 2) {
		return alienStr1[alienStrNum] + ' ';
	} else if(num >=2 && num < 4) {
		return alienStr2[alienStrNum] + ' ';
	} else if(num >=4 && num < 8) {
		return alienStr3[alienStrNum] + ' ';
	}
}

function setBonus() {
	var bonusStr = '', targetStr, targetDeathStr;
	
	// Vertical row loop
	for(var i=0; i < 2; i++) {
		if(i == 0) {
			targetStr = bonusUpperStr[bonusStrNum];
			targetDeathStr = bonusUpperDeathStr;
		} else if(i == 1) {
			targetStr = bonusLowerStr[bonusStrNum];
			targetDeathStr = bonusLowerDeathStr;
		}
		
		for(var j=0; j < width; j++) {
			// See if the horizontal position matches.
			if(j == bonusX) {
				// Position match, check if player is shooting.
				if(shot) {
					// Player is shooting. Check vertical positioning.
					if(i == shotY || i == (shotY+1) ) {
						// Vertical position match. Check horizontal positioning.
						if(shotX >= j && shotX < j + bonusWidth) {
							// Horizontal positioning match. Shot is hitting the
							// bonus alien. Time to kill it off.
							
							bonusStr += targetDeathStr;
							bonus = false;
							_bonusShip.pause();
							_bonusShip.currentTime = 0;
							_bonusHit.play();
							if(i == 1) { score += bonusScore; shot = false; }
						} else {
							// Horizontal positioning does not collide.
							// Render bonus alien as normal.
							bonusStr += targetStr;
						}
					} else {
						// Vertical positioning does not collide.
						// Render bonus alien as normal.
						bonusStr += targetStr;
					}
				} else {
					// Player isn't shooting.
					// Render bonus alien string as normal.
					bonusStr += targetStr;
				}
				j += bonusWidth-1;
			} else {
				bonusStr += setFiller(j, i, ' ');
			}
		}
		
		if(i == 1) {
			bonusX++;

			if(!bonus) { bonusX = 0; _bonusShip.pause(); _bonusShip.currentTime = 0; }
			
			if(bonusX >= width-bonusWidth) {
				bonus = false;
				bonusX = 0;
				_bonusShip.pause();
				_bonusShip.currentTime = 0;
			}
		}
		
		bonusStr += '\n';
	}
	
	return bonusStr;
}

function setBunker(yPos) {
	var bunkerStr = '';
	
	// Vertical row looper
	for(var i=0; i < 5; i++) {
		// Horizontal column looper
		for(var j=0; j < width; j++) {
			if(j == bunkerX) {
				// Bunker looper
				for(var k=0; k < bunkerArray.length; k++) {
					// For every bunker in the array, loop through its width.
					// The row is determined by i*bunkerWidth.
					for(var l=i*bunkerWidth; l < (i+1)*bunkerWidth; l++) {
						var xPos = j + l - i*bunkerWidth;
						
						// Check if bunker cell is destroyed or not
						if(bunkerArray[k][l] == 1) {
							// Bunker cell is still intact.
							// Detect collision with alien/player shot. If they
							// overlap, destroy this bunker cell.
							if(	alienShot && yPos + i == alienShotY + 1 && xPos == alienShotX ||
								shot && yPos + i == shotY && xPos == shotX || 
								shot && yPos + i == shotY + 1 && xPos == shotX) {
									// Shot collision detected.
									// Check if it is alien shot or player shot.
									if(alienShot) {
										// It is alien shot, so remove the alien shot.
										alienShot = false;
									} else {
										// It is player shot, so remove thie player shot.
										shot = false;
									}
									bunkerArray[k][l] = 0;
									bunkerStr += '*';
							} else {
								// No shot collision, render the bunker string.
								bunkerStr += '=';
							}
						} else {
							// Bunker cell is destroyed. Render the filler string.
							bunkerStr += setFiller(xPos, yPos+i, ' ');
						}
					}
					
					// Looper for the gutter space between each bunkers.
					for(var m=0; m < bunkerGutter; m++) {
						bunkerStr += setFiller(j + bunkerWidth + m, yPos+i, ' ');
					}
					
					j += bunkerWidth + bunkerGutter;
				}
				
				j--;
			} else {
				bunkerStr += setFiller(j, yPos+i, ' ');
			}
		}
		
		bunkerStr += '\n';
	}
	
	return bunkerStr;
}

function setFiller(xPos, yPos, character) {
	// Detect if player is shooting; if yes, check position of the shot,
	// and render if the position matches
	if(shot && yPos == shotY && xPos == shotX || shot && yPos == shotY + 1 && xPos == shotX) {
		return '|';
	} else if(alienShot && yPos == alienShotY && xPos == alienShotX) {
		return '[';
	} else if(alienShot && yPos == alienShotY + 1 && xPos == alienShotX) {
		return ']';
	} else {
		return character;
	}
}

function findColumnLimit() {
	if(alienColumn > 0) {
		for(var i=0; i <= alienArray.length; i += alienColumn) {
			if(alienArray[i] == 1) {
				break;
			} else if(i >= alienArray.length) {
				for(var j=alienArray.length; j >= 0; j -= alienColumn) {
					if(alienArray.length > 1) {
						alienArray.splice(j, 1);
						
						if(j <= 0) {
							alienX += 8;
							alienXLimit += 8;
							alienColumn--;
							break;
						}
					}
				}
			}
		}
		
		for(var a=alienColumn-1; a <= alienArray.length; a += alienColumn) {
			if(alienArray[a] == 1) {
				break;
			} else if(a >= alienArray.length-1) {
				for(var b=alienArray.length-1; b >= 0; b -= alienColumn) {
					if(alienArray.length > 1) {
						alienArray.splice(b, 1);
					
						if(b <= alienColumn-1) {
							alienXLimit += 8;
							alienColumn--;
							break;
						}
					}
				}
			}
		}
	}
	
	if(alienRow > 0) {
		for(var z=alienArray.length-1; z >= alienArray.length-alienColumn; z--) {
			if(alienArray[z] == 1) {
				break;
			} else if(z <= alienArray.length-alienColumn) {
				if(alienArray.length > 1) {
					alienArray.splice(alienArray.length-alienColumn, alienColumn);
					alienRow--;
					break;
				}
			}
		}
	}
	
	/** console.log('alienRow: ' + alienRow);
	console.log('alienColumn: ' + alienColumn);
	console.log('alienArray: ' + alienArray); **/
}

function setFooter() {
	var footerStr = '',
		leftSpace = 5,
		gutterStr = '  ',
		gutter = 2,
		livesCount = 1;
	
	for(var i=0; i < 6; i++) {
		for(var j=0; j < width; j++) {
			if(i == 2) {
				footerStr += '=';
			} else if(i == 4) {
				if(j < leftSpace || j > leftSpace) {
					if(j > width - 5) {
						footerStr += score;
						j += 4;
					} else {
						footerStr += ' ';
					}
				} else if(j == leftSpace) {
					for(var k=0; k < playerLives; k++) {
						footerStr += ' ' + playerUpperStr + ' ' + gutterStr;
						j += playerUpperWidth + 2 + gutter;
					}
				}
			} else if(i == 5) {
				if(j < leftSpace || j > leftSpace) {
					footerStr += ' ';
				} else if(j == leftSpace) {
					for(var k=0; k < playerLives; k++) {
						footerStr += playerLowerStr + gutterStr;
						j += playerLowerWidth + gutter;
					}
				}
			}
		}
		
		footerStr += '\n';
	}
	
	return footerStr;
}

function shoot() {
	shotX = playerX + 3;
	shotY = height - 4;
	shot = true;
	_playerShoot.play();
}

function alienShoot() {
	var column = Math.round(Math.random()*(alienColumn-1)+1),
		row = selectRow(column);
	
	while(row == 0) {
		column = Math.round(Math.random()*alienColumn);
		row = selectRow(column);
	}
	
	alienShotX = alienX + 3 + (column-1)*8;
	alienShotY = row * 2 + alienY-1;
	alienShot = true;
	
	function selectRow(column) {
		var targetColumn = alienArray.length - alienColumn - 1 + column,
			row = alienRow;
		
		for(var i=targetColumn; i >= 0; i -= alienColumn) {
			if(alienArray[i] == 0) {
				row--;
				if(i <= alienColumn-1 && row == 0) {
					return row;
				} 
			} else if(alienArray[i] == 1) {
				return row;
			}
		}
	}
}

function stopGame(message) {
	clearInterval(gameInterval);
	clearTimeout(alienTimeout);
	
	_bonusShip.pause();
	_bonusShip.currentTime = 0;
	
	if(message == 'lost-life') {
		playerLives--;
		bonus = false;
		
		setTimeout(function() {
			playerDead = false;
			playerX = 5;
			if(playerLives < 0) {
				refreshCanvas('game-over');
				setTimeout(function() {
					refreshCanvas('game-title');
					init();
				}, 3000);
			} else {
				initGame();
			}
		}, 1500);
	} else if(message != 'none') {
		$('body').append('<span>' + message + '</span>');
		
		setTimeout(function() {
			$('body').find('span').remove();
			
			if(message == 'WIN!') {
				canvas.val(' ');
			}
			
			setTimeout(function() {
				if(message == 'LOSE!') {
					refreshCanvas('game-over');
					
					setTimeout(function() {
						refreshCanvas('game-title');
						init();
					}, 3000);
				} else {
					resetGame();
				}
			}, 1000);
		}, 1500);
	}
	
	if(message == 'WIN!') {
		alienStartingY += 2;
	}
}

function resetGame(state) {
	playerX = 5;
	playerDead = false;
	
	if(state == 'whole-game') {
		playerLives = 3;
		alienStartingY = 5;
		score = 0;
	}
	
	shot = false;
	
	alienX = 5;
	alienY = alienStartingY;
	alienXLimit = 30;
	alienDirection = 'right';
	alienRow = 7;
	alienColumn = 8;
	alienSpeed = 800;
	alienArray = aliens.slice(0);
	
	alienShot = false;
	
	bonus = false;
	
	bunker1 = bunker.slice(0);
	bunker2 = bunker.slice(0);
	bunker3 = bunker.slice(0);
	bunker4 = bunker.slice(0);
	bunkerArray = [bunker1, bunker2, bunker3, bunker4];
	
	if(bonus) { _bonusShip.play(); }
	
	initGame();
}

function refreshCanvas(action) {
	var canvasArray = canvas.val().split('\n'),
		refreshNum = (action == 'game-over') ? 10 : 0,
		targetNum = (action == 'game-over') ? 10 + gameOverScreen.length : canvasArray.length,
		refreshInterval;
	
	refreshInterval = setInterval(function() {
		if(action == 'game-title') {
			canvasArray[refreshNum] = titleScreen[refreshNum];
		} else if(action == 'game-over') {
			canvasArray[refreshNum] = gameOverScreen[refreshNum-10];
		} else {
			canvasArray[refreshNum] = blankLine();
		}
		
		canvas.val(canvasArray.join('\n'));
		
		refreshNum++;
		
		if(refreshNum >= targetNum) {
			clearInterval(refreshInterval);
			refreshNum = 0;
			
			if(action == 'game-start') { resetGame('whole-game'); }
		}
	}, 50);
	
	function blankLine() {
		var blankStr = '';
		for(var i=width; i > 0; i--) { blankStr += ' '; }
		return blankStr;
	}
}