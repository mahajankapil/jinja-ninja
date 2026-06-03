(function(window, document) {

// ─────────────────────────────────────────────
//  CONSTANTS & RESOURCE TABLES
// ─────────────────────────────────────────────

var RESOURCES_FOLDER_PATH = "";

var requestAnimationFrame = (function() {
	if (window.requestAnimationFrame) return window.requestAnimationFrame;
	if (window.oRequestAnimationFrame) return window.oRequestAnimationFrame;
	if (window.msRequestAnimationFrame) return window.msRequestAnimationFrame;
	if (window.mozRequestAnimationFrame) return window.mozRequestAnimationFrame;
	return function(callback) { setTimeout(callback, 1000 / 60); };
})();

window.requestAnimFrame = requestAnimationFrame;

// Inject stylesheet
var link = document.createElement("link");
link.setAttribute("rel", "stylesheet");
link.setAttribute("href", RESOURCES_FOLDER_PATH + "css/love-game.css");
document.head.appendChild(link);

var RESOURCES = {
	"JUMP"               : "images/jump.png",
	"RUNNING_CHANGE_STEP": "images/running-change-step.png",
	"RUNNING_LEFT_STEP"  : "images/running-left-step.png",
	"RUNNING_RIGHT_STEP" : "images/running-right-step.png",
	"SHOOT_CHANGE_STEP"  : "images/shoot-change-step.png",
	"SHOOT_JUMP"         : "images/shoot-jump.png",
	"SHOOT_LEFT-STEP"    : "images/shoot-left-step.png",
	"SHOOT_RIGHT-STEP"   : "images/shoot-right-step.png",
	"SHOOT"              : "images/shoot.png",
	"SLIDE"              : "images/slide.png",
	"DOWN"               : "images/down.png",
	"STANDING"           : "images/standing.png",
	"WEB_PROJECTILE"     : "images/web.png",
	"BACKGROUND"         : "images/background.jpg",
	"ROOF"               : "images/wall.jpg",
	"BUILDING"           : "images/building.png",
	"SPIDER_HEAD"        : "images/spider-head.png",
	"HEART"              : "images/heart.png",
	"VENOM"              : "images/venom.png",
	"THUG"               : "images/villi.gif",
	"THUG_LIGHT"         : "images/thug-light.gif",
	"THUG_1"             : "images/thug.png",
	"THUG_2"             : "images/thug.png",
	"THUG_3"             : "images/thug.png",
	"THUG_4"             : "images/thug.png",
	"THUG_5"             : "images/thug.png",
	"IN"                 : "images/in.gif",
	"KEY"                : "images/key.png",
	"DOOR_CLOSED"        : "images/CLOSED.png",
	"DOOR_OPENED"        : "images/OPENED.png",
	"KNIFE"              : "images/knife.png",
};

var AUDIO_RESOURCES = {
	"AMAZING_SPIDER_MAN_2" : new Audio(RESOURCES_FOLDER_PATH + "audio/amazing-spider-man-2.mp3"),
	"FRIENDLY_SPIDERMAN"   : new Audio(RESOURCES_FOLDER_PATH + "audio/60-theme-song.mp3"),
	"MOVIE_THEME"          : new Audio(RESOURCES_FOLDER_PATH + "audio/old-theme.mp3"),
	"ANIMATED_SERIES"      : new Audio(RESOURCES_FOLDER_PATH + "audio/animated-series-theme.mp3"),
	"SHOOT"                : new Audio(RESOURCES_FOLDER_PATH + "audio/shooting-web.mp3"),
	"JUMP"                 : new Audio(RESOURCES_FOLDER_PATH + "audio/Jump.MP3"),
	"PICKUP"               : new Audio(RESOURCES_FOLDER_PATH + "audio/pickup.mp3"),
};

var AUDIO_LOOP = [
	"AMAZING_SPIDER_MAN_2",
	"FRIENDLY_SPIDERMAN",
	"MOVIE_THEME",
	"ANIMATED_SERIES",
];

var KEY_CODE = {
	ARROW_LEFT: 37,
	ARROW_UP:   38,
	ARROW_RIGHT:39,
	ARROW_DOWN: 40,
	SPACEBAR:   32,
	A: 65,
	S: 87,
	D: 68,
	W: 87,
	ESC: 27,
};

var DIRECTION = { RIGHT: 1, LEFT: -1 };

// ─────────────────────────────────────────────
//  SAVE SYSTEM
// ─────────────────────────────────────────────

var SaveSystem = {
	KEYS: {
		UNLOCKED: 'jn_unlocked',
		COMPLETED: 'jn_completed',
	},
	getUnlocked: function() {
		try { return parseInt(localStorage.getItem(this.KEYS.UNLOCKED) || '1', 10); } catch(e) { return 1; }
	},
	setUnlocked: function(level) {
		try { localStorage.setItem(this.KEYS.UNLOCKED, String(level)); } catch(e) {}
	},
	getCompleted: function() {
		try { return JSON.parse(localStorage.getItem(this.KEYS.COMPLETED) || '[]'); } catch(e) { return []; }
	},
	markCompleted: function(levelId) {
		try {
			var list = this.getCompleted();
			if (list.indexOf(levelId) === -1) list.push(levelId);
			localStorage.setItem(this.KEYS.COMPLETED, JSON.stringify(list));
			var highest = this.getUnlocked();
			if (levelId >= highest) this.setUnlocked(levelId + 1);
		} catch(e) {}
	},
	isCompleted: function(levelId) {
		return this.getCompleted().indexOf(levelId) !== -1;
	},
};

// ─────────────────────────────────────────────
//  PROGRESS BAR
// ─────────────────────────────────────────────

function ProgressBar(game) {
	this.game    = game;
	this.visible = false;
	this.pct     = 0; // 0..1
}

ProgressBar.prototype.show = function() { this.visible = true; };
ProgressBar.prototype.hide = function() { this.visible = false; };

ProgressBar.prototype.update = function(playerX, startX, endX) {
	if (!this.visible) return;
	if (!endX || endX <= startX) return;

	this.pct = Math.min(1, Math.max(0, (playerX - startX) / (endX - startX)));

	var ctx    = this.game.ctx;
	var cw     = this.game.canvas.width;
	var BAR_H  = 10;
	var BAR_W  = cw - 140; // leave room for key icon on left, score on top-center
	var BAR_X  = 70;
	var BAR_Y  = 18;
	var RADIUS = BAR_H / 2;

	// track background
	ctx.save();
	ctx.fillStyle = 'rgba(0,0,0,0.55)';
	this._roundRect(ctx, BAR_X - 2, BAR_Y - 2, BAR_W + 4, BAR_H + 4, RADIUS + 2);
	ctx.fill();

	// track
	ctx.fillStyle = '#333';
	this._roundRect(ctx, BAR_X, BAR_Y, BAR_W, BAR_H, RADIUS);
	ctx.fill();

	// fill — colour shifts green→yellow→red as progress grows (just looks cool)
	var r = Math.round(255 * this.pct);
	var g = Math.round(255 * (1 - this.pct * 0.5));
	ctx.fillStyle = 'rgb(' + r + ',' + g + ',40)';
	if (this.pct > 0) {
		this._roundRect(ctx, BAR_X, BAR_Y, Math.max(RADIUS * 2, BAR_W * this.pct), BAR_H, RADIUS);
		ctx.fill();
	}

	// border glow
	ctx.strokeStyle = 'rgba(255,255,255,0.25)';
	ctx.lineWidth   = 1;
	this._roundRect(ctx, BAR_X, BAR_Y, BAR_W, BAR_H, RADIUS);
	ctx.stroke();

	// "START" label left end
	ctx.fillStyle   = 'rgba(255,255,255,0.7)';
	ctx.font        = '9px LoveGamePixelFont, monospace';
	ctx.textAlign   = 'center';
	ctx.textBaseline= 'middle';
	ctx.fillText('START', BAR_X + 20, BAR_Y + BAR_H / 2);

	// "END" label right end  — show door icon emoji
	ctx.fillText('🚪', BAR_X + BAR_W - 8, BAR_Y + BAR_H / 2 + 1);

	// percentage text in the middle
	ctx.fillStyle = 'white';
	ctx.font = 'bold 9px LoveGamePixelFont, monospace';
	ctx.fillText(Math.round(this.pct * 100) + '%', BAR_X + BAR_W / 2, BAR_Y + BAR_H / 2);

	ctx.restore();
};

ProgressBar.prototype._roundRect = function(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.arcTo(x + w, y, x + w, y + r, r);
	ctx.lineTo(x + w, y + h - r);
	ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
	ctx.lineTo(x + r, y + h);
	ctx.arcTo(x, y + h, x, y + h - r, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + r, y, r);
	ctx.closePath();
};

// ─────────────────────────────────────────────
//  GAME MODE MANAGER  (main menu)
// ─────────────────────────────────────────────

function GameModeManager(game) {
	this.game = game;
	this.mode = null;
	this.dom  = null;
}

GameModeManager.prototype.showMenu = function() {
	var self = this;
	this.hide();

	var canvasRect = this.game.canvas.getBoundingClientRect();
	var cx = canvasRect.left + this.game.canvas.width  / 2;
	var cy = canvasRect.top  + this.game.canvas.height / 2;

	var container = document.createElement('div');
	container.className = 'spiderman-game-mode-menu';
	Object.assign(container.style, {
		position : 'fixed',
		left     : cx + 'px',
		top      : cy + 'px',
		transform: 'translate(-50%,-50%)',
		zIndex   : '10000',
		background: 'linear-gradient(160deg,rgba(12,0,30,0.97) 0%,rgba(0,20,60,0.97) 100%)',
		border   : '2px solid rgba(200,30,30,0.8)',
		borderRadius: '14px',
		padding  : '32px 40px 28px',
		textAlign: 'center',
		boxShadow: '0 0 40px rgba(200,30,30,0.4), inset 0 0 60px rgba(0,0,80,0.3)',
		minWidth : '280px',
		fontFamily: 'LoveGamePixelFont, monospace',
	});

	container.innerHTML = [
		'<div style="font-size:38px;margin-bottom:4px">🕷️</div>',
		'<h2 style="color:#fff;margin:0 0 4px;font-size:22px;letter-spacing:2px;text-shadow:0 0 12px rgba(255,80,80,0.8)">JINJA NINJA</h2>',
		'<div style="color:rgba(255,255,255,0.45);font-size:10px;margin-bottom:24px;letter-spacing:3px">SELECT GAME MODE</div>',
		'<button id="gm-free" class="jn-menu-btn" style="display:block;width:100%;margin-bottom:12px">',
		'  <span style="font-size:18px">🎮</span><br>',
		'  <span style="font-size:14px;letter-spacing:1px">FREE PLAY</span><br>',
		'  <span style="font-size:9px;opacity:0.6">Infinite — fight forever</span>',
		'</button>',
		'<button id="gm-levels" class="jn-menu-btn">',
		'  <span style="font-size:18px">🏆</span><br>',
		'  <span style="font-size:14px;letter-spacing:1px">LEVELS</span><br>',
		'  <span style="font-size:9px;opacity:0.6">Collect key · reach the door</span>',
		'</button>',
	].join('');

	// shared button style
	var btnStyle = [
		'background:linear-gradient(135deg,rgba(180,0,0,0.7) 0%,rgba(100,0,0,0.8) 100%)',
		'border:1px solid rgba(255,80,80,0.5)',
		'color:white',
		'padding:12px 20px',
		'border-radius:8px',
		'cursor:pointer',
		'font-family:LoveGamePixelFont,monospace',
		'transition:all 0.15s',
		'line-height:1.5',
	].join(';');

	container.querySelectorAll('.jn-menu-btn').forEach(function(b) {
		b.setAttribute('style', b.getAttribute('style') + ';' + btnStyle);
		b.addEventListener('mouseover', function() {
			this.style.background = 'linear-gradient(135deg,rgba(220,30,30,0.9) 0%,rgba(140,0,0,0.95) 100%)';
			this.style.transform  = 'scale(1.03)';
			this.style.boxShadow  = '0 0 18px rgba(255,80,80,0.5)';
		});
		b.addEventListener('mouseout', function() {
			this.style.background = 'linear-gradient(135deg,rgba(180,0,0,0.7) 0%,rgba(100,0,0,0.8) 100%)';
			this.style.transform  = '';
			this.style.boxShadow  = '';
		});
	});

	document.body.appendChild(container);
	this.dom = container;

	container.querySelector('#gm-free').onclick = function() {
		self.mode = 'FREE_PLAY';
		self.hide();
		self.game.startFreePlay();
	};
	container.querySelector('#gm-levels').onclick = function() {
		self.mode = 'LEVELS';
		self.hide();
		self.game.showLevelSelect();
	};
};

GameModeManager.prototype.hide = function() {
	if (this.dom && this.dom.parentNode) this.dom.parentNode.removeChild(this.dom);
	this.dom = null;
};

// ─────────────────────────────────────────────
//  LEVEL MANAGER
// ─────────────────────────────────────────────

function LevelManager(game) {
	this.game        = game;
	this.active      = false;
	this.mode        = null;
	this.current     = null;
	this.levelStartX = 0;
	this.levelEndX   = null;
	this.keyX        = null;
	this.stats       = { startTime: 0, enemiesStart: 0 };
}

LevelManager.prototype.startLevel = function(levelId) {
	this.active      = true;
	this.mode        = 'LEVELS';
	this.current     = levelId;
	this.levelStartX = (this.game.spiderman && this.game.spiderman.x) || this.game.cameraX || 0;
	this.levelEndX   = null;
	this.keyX        = null;
	this.stats.startTime    = Date.now();
	this.stats.enemiesStart = this.game.score || 0;
	this.game.spawnLevel(levelId);
};

LevelManager.prototype.completeLevel = function() {
	if (!this.active) return;
	this.active = false;
	var self    = this;

	try { this.game.pause(); } catch(e) {}

	var elapsed         = Math.round((Date.now() - this.stats.startTime) / 1000);
	var enemiesDefeated = (this.game.score || 0) - this.stats.enemiesStart;
	var mins = Math.floor(elapsed / 60);
	var secs = elapsed % 60;
	var timeStr = (mins > 0 ? mins + 'm ' : '') + secs + 's';

	SaveSystem.markCompleted(this.current);

	// overlay
	var canvasRect = this.game.canvas.getBoundingClientRect();
	var cx = canvasRect.left + this.game.canvas.width  / 2;
	var cy = canvasRect.top  + this.game.canvas.height / 2;

	var overlay = document.createElement('div');
	overlay.className = 'level-complete-overlay';
	Object.assign(overlay.style, {
		position   : 'fixed',
		left       : cx + 'px',
		top        : cy + 'px',
		transform  : 'translate(-50%,-50%)',
		zIndex     : '10001',
		background : 'linear-gradient(160deg,rgba(0,20,0,0.97) 0%,rgba(0,50,10,0.97) 100%)',
		border     : '2px solid rgba(50,200,50,0.7)',
		borderRadius:'14px',
		padding    : '30px 44px',
		textAlign  : 'center',
		color      : 'white',
		fontFamily : 'LoveGamePixelFont, monospace',
		boxShadow  : '0 0 40px rgba(50,255,50,0.3)',
		minWidth   : '280px',
	});

	overlay.innerHTML = [
		'<div style="font-size:36px;margin-bottom:8px">🏆</div>',
		'<h2 style="color:#6eff6e;margin:0 0 20px;font-size:20px;letter-spacing:2px;text-shadow:0 0 12px rgba(100,255,100,0.6)">LEVEL ' + this.current + ' COMPLETE!</h2>',
		'<div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:14px 20px;margin-bottom:20px;line-height:2.2;font-size:13px">',
		'  <div>⚔️  Enemies defeated: <b style="color:#6eff6e">' + enemiesDefeated + '</b></div>',
		'  <div>⏱️  Time: <b style="color:#6eff6e">' + timeStr + '</b></div>',
		'  <div>🎯  Score: <b style="color:#6eff6e">' + this.game.score + '</b></div>',
		'</div>',
		'<button id="jn-next-level" style="',
		'  display:block;width:100%;padding:12px;',
		'  background:linear-gradient(135deg,rgba(0,150,0,0.8),rgba(0,80,0,0.9));',
		'  border:1px solid rgba(80,255,80,0.5);border-radius:8px;',
		'  color:white;cursor:pointer;font-family:LoveGamePixelFont,monospace;',
		'  font-size:14px;letter-spacing:1px;margin-bottom:10px">',
		'  NEXT LEVEL ▶',
		'</button>',
		'<button id="jn-replay" style="',
		'  display:block;width:100%;padding:10px;',
		'  background:rgba(255,255,255,0.08);',
		'  border:1px solid rgba(255,255,255,0.2);border-radius:8px;',
		'  color:rgba(255,255,255,0.7);cursor:pointer;font-family:LoveGamePixelFont,monospace;',
		'  font-size:11px;letter-spacing:1px">',
		'  🔁 PLAY AGAIN',
		'</button>',
	].join('');

	document.body.appendChild(overlay);

	overlay.querySelector('#jn-next-level').onclick = function() {
		if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
		try { self.game.unpause(); } catch(e) {}
		self.game.restart();
		self.game.showLevelSelect();
	};
	overlay.querySelector('#jn-replay').onclick = function() {
		if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
		try { self.game.unpause(); } catch(e) {}
		self.game.restart();
		self.game.startLevel(self.current);
	};
};

LevelManager.prototype._showNextLevelScreen = function() {
	var self       = this;
	var canvasRect = this.game.canvas.getBoundingClientRect();
	var cx = canvasRect.left + this.game.canvas.width  / 2;
	var cy = canvasRect.top  + this.game.canvas.height / 2;

	var screen = document.createElement('div');
	Object.assign(screen.style, {
		position   : 'fixed',
		left       : cx + 'px',
		top        : cy + 'px',
		transform  : 'translate(-50%,-50%)',
		zIndex     : '10002',
		background : 'linear-gradient(160deg,rgba(10,0,30,0.97),rgba(30,0,60,0.97))',
		border     : '2px solid rgba(200,100,255,0.6)',
		borderRadius:'14px',
		padding    : '32px 44px',
		textAlign  : 'center',
		color      : 'white',
		fontFamily : 'LoveGamePixelFont, monospace',
		boxShadow  : '0 0 40px rgba(180,80,255,0.3)',
		minWidth   : '260px',
	});

	screen.innerHTML = [
		'<div style="font-size:34px;margin-bottom:8px">🔒</div>',
		'<h2 style="color:#d080ff;margin:0 0 10px;font-size:18px;letter-spacing:2px">LEVEL 2</h2>',
		'<p style="color:rgba(255,255,255,0.6);font-size:11px;margin-bottom:24px">Coming Soon...</p>',
		'<button id="jn-back-menu" style="',
		'  display:block;width:100%;padding:11px;',
		'  background:linear-gradient(135deg,rgba(140,0,180,0.7),rgba(80,0,120,0.85));',
		'  border:1px solid rgba(200,80,255,0.5);border-radius:8px;',
		'  color:white;cursor:pointer;font-family:LoveGamePixelFont,monospace;',
		'  font-size:12px;letter-spacing:1px">',
		'  ← MAIN MENU',
		'</button>',
	].join('');

	document.body.appendChild(screen);

	screen.querySelector('#jn-back-menu').onclick = function() {
		if (screen.parentNode) screen.parentNode.removeChild(screen);
		self.game.restart();
		self.game.gameModeManager.showMenu();
	};
};

// ─────────────────────────────────────────────
//  LEVEL SELECT
// ─────────────────────────────────────────────

LoveGame.prototype.showLevelSelect = function() {
	var self = this;

	var canvasRect = this.canvas.getBoundingClientRect();
	var cx = canvasRect.left + this.canvas.width  / 2;
	var cy = canvasRect.top  + this.canvas.height / 2;

	var container = document.createElement('div');
	container.className = 'jn-level-select';
	Object.assign(container.style, {
		position   : 'fixed',
		left       : cx + 'px',
		top        : cy + 'px',
		transform  : 'translate(-50%,-50%)',
		zIndex     : '10000',
		background : 'linear-gradient(160deg,rgba(12,0,30,0.97),rgba(0,10,50,0.97))',
		border     : '2px solid rgba(200,30,30,0.7)',
		borderRadius:'14px',
		padding    : '28px 36px',
		textAlign  : 'center',
		fontFamily : 'LoveGamePixelFont, monospace',
		boxShadow  : '0 0 40px rgba(200,30,30,0.35)',
		minWidth   : '260px',
	});

	var unlocked  = SaveSystem.getUnlocked();
	var completed = SaveSystem.getCompleted();

	var isL1Done = completed.indexOf(1) !== -1;
	var starHTML = isL1Done ? '⭐' : '';
	var isL2Done = completed.indexOf(2) !== -1;
	var star2HTML = isL2Done ? '⭐' : '';

	// Level 2 unlocked once Level 1 is completed
	var l2Unlocked = unlocked >= 2;
	var l2Style = l2Unlocked
		? 'background:linear-gradient(135deg,rgba(0,80,180,0.7),rgba(0,40,100,0.85));border:1px solid rgba(80,160,255,0.5);color:white;cursor:pointer;'
		: 'background:rgba(60,60,60,0.4);border:1px solid rgba(120,120,120,0.3);color:rgba(255,255,255,0.3);cursor:not-allowed;';

	container.innerHTML = [
		'<div style="color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:3px;margin-bottom:20px">SELECT LEVEL</div>',
		// Level 1
		'<button id="jn-lvl-1" class="jn-lvl-btn" style="display:flex;align-items:center;width:100%;padding:14px 16px;',
		'  background:linear-gradient(135deg,rgba(180,0,0,0.7),rgba(100,0,0,0.85));',
		'  border:1px solid rgba(255,80,80,0.5);border-radius:10px;color:white;cursor:pointer;',
		'  font-family:LoveGamePixelFont,monospace;margin-bottom:10px">',
		'  <span style="font-size:22px;margin-right:12px">🏙️</span>',
		'  <span style="text-align:left">',
		'    <span style="display:block;font-size:13px;letter-spacing:1px">LEVEL 1 ' + starHTML + '</span>',
		'    <span style="display:block;font-size:9px;opacity:0.6;margin-top:2px">City Rooftops</span>',
		'  </span>',
		'</button>',
		// Level 2
		'<button id="jn-lvl-2" ' + (l2Unlocked ? '' : 'disabled') + ' class="jn-lvl-btn" style="display:flex;align-items:center;width:100%;padding:14px 16px;',
		'  ' + l2Style,
		'  border-radius:10px;font-family:LoveGamePixelFont,monospace;margin-bottom:10px">',
		'  <span style="font-size:22px;margin-right:12px">' + (l2Unlocked ? '🏯' : '🔒') + '</span>',
		'  <span style="text-align:left">',
		'    <span style="display:block;font-size:13px;letter-spacing:1px">LEVEL 2 ' + star2HTML + '</span>',
		'    <span style="display:block;font-size:9px;opacity:0.6;margin-top:2px">' + (l2Unlocked ? 'Floating Platforms' : 'Complete Level 1 to unlock') + '</span>',
		'  </span>',
		'</button>',
		'<button id="jn-back-main" style="',
		'  background:none;border:none;color:rgba(255,255,255,0.4);',
		'  cursor:pointer;font-family:LoveGamePixelFont,monospace;',
		'  font-size:10px;margin-top:8px;letter-spacing:1px">← BACK',
		'</button>',
	].join('');

	document.body.appendChild(container);

	container.querySelector('#jn-lvl-1').onclick = function() {
		if (container.parentNode) container.parentNode.removeChild(container);
		self.restart();
		self.startLevel(1);
	};
	var lvl2Btn = container.querySelector('#jn-lvl-2');
	if (lvl2Btn && !lvl2Btn.disabled) {
		lvl2Btn.onclick = function() {
			if (container.parentNode) container.parentNode.removeChild(container);
			self.restart();
			self.startLevel(2);
		};
	}
	container.querySelector('#jn-back-main').onclick = function() {
		if (container.parentNode) container.parentNode.removeChild(container);
		self.gameModeManager.showMenu();
	};
};

// ─────────────────────────────────────────────
//  KEY COLLECTIBLE
// ─────────────────────────────────────────────

function Key(game, opts) {
	opts = opts || {};
	this.game      = game;
	this.x         = opts.x || 0;
	this.y         = opts.y || 0;
	this.scale     = opts.scale || 0.14;
	this.collected = false;
	this.stateImg  = this.game.resources.KEY || { width: 754, height: 350 };
	// bob animation
	this._bobFrame = Math.random() * Math.PI * 2;
	// glow pulse
	this._glowPhase = 0;
}

Key.prototype.update = function() {
	if (this.collected) return;

	this._bobFrame  += 0.06;
	this._glowPhase += 0.08;

	var renderX = this.x - this.game.cameraX;
	var img     = this.stateImg;
	var width   = img.width  * this.scale;
	var height  = img.height * this.scale;
	var bobY    = this.y + Math.sin(this._bobFrame) * 4;

	// cull off-screen
	if (renderX + width < -100 || renderX > this.game.canvas.width + 100) return;

	var ctx = this.game.ctx;
	ctx.save();

	// glow
	var glow   = 6 + Math.sin(this._glowPhase) * 4;
	ctx.shadowColor = 'rgba(255,220,0,0.9)';
	ctx.shadowBlur  = glow;

	ctx.drawImage(img, renderX, bobY, width, height);

	// sparkle dots
	ctx.shadowBlur = 0;
	ctx.fillStyle  = 'rgba(255,255,100,0.8)';
	var t = this._bobFrame;
	[
		[renderX - 6 + Math.cos(t) * 5,       bobY - 4 + Math.sin(t * 1.3) * 4],
		[renderX + width + 4 + Math.sin(t) * 4, bobY + height / 2 + Math.cos(t * 0.9) * 5],
	].forEach(function(p) {
		ctx.beginPath();
		ctx.arc(p[0], p[1], 1.5, 0, Math.PI * 2);
		ctx.fill();
	});

	ctx.restore();
};

// ─────────────────────────────────────────────
//  EXIT DOOR
// ─────────────────────────────────────────────

function Door(game, opts) {
	opts = opts || {};
	this.game      = game;
	this.x         = opts.x || 0;
	this.y         = opts.y || 0;
	this.scale     = opts.scale || 0.5;
	this.open      = false;
	this.hidden    = !!opts.hidden;
	this.closedImg = this.game.resources.DOOR_CLOSED || { width: 32, height: 48 };
	this.openedImg = this.game.resources.DOOR_OPENED || this.closedImg;
	// stateImg alias so collision detection can use width/height
	this.stateImg  = this.closedImg;
	// subtle pulse when player is near without key
	this._shakeFrame  = 0;
	this._shakeActive = false;
}

Door.prototype.update = function() {
	if (this.hidden) return;

	var img     = this.open ? this.openedImg : this.closedImg;
	this.stateImg = img;
	var renderX = this.x - this.game.cameraX;
	var width   = img.width  * this.scale;
	var height  = img.height * this.scale;
	var drawY   = this.y - height;

	// cull
	if (renderX + width < -50 || renderX > this.game.canvas.width + 50) return;

	var ctx = this.game.ctx;
	ctx.save();

	if (this.open) {
		// green glow when open
		ctx.shadowColor = 'rgba(60,255,60,0.7)';
		ctx.shadowBlur  = 14;
	} else {
		// red pulse when closed and player nearby without key
		var sp   = this.game.spiderman;
		var dist = sp ? Math.abs(sp.x - this.x) : 9999;
		if (dist < 200) {
			ctx.shadowColor = 'rgba(255,40,40,0.6)';
			ctx.shadowBlur  = 8 + Math.sin(this._shakeFrame * 0.15) * 6;
			this._shakeFrame++;
		}
	}

	ctx.drawImage(img, renderX, drawY, width, height);
	ctx.restore();
};

// ─────────────────────────────────────────────
//  LOVEGAME CONSTRUCTOR
// ─────────────────────────────────────────────

function LoveGame(opts) {
	var options = {
		canvas      : "canvas",
		score       : 0,
		muted       : false,
		soundEffects: true,
	};
	opts = opts || {};
	for (var option in options) {
		if (opts.hasOwnProperty(option)) options[option] = opts[option];
		this[option] = options[option];
	}

	this.frame        = 0;
	this.resources    = {};
	this.cameraX      = 0;
	this.score        = this.score || 0;
	this.scene        = { spiderman: null, projectiles: [], roofs: [], enemies: [], items: [], platforms: [], grabPoints: [] };
	this.currentLevel = 1;
	this.hasKey       = false;
	this.levelComplete= false;
	this.roofCount    = 0;
	this.gameModeManager = null;
	this.levelManager    = null;
	this.progressBar     = null;
	this._levelDoor      = null;
	this.levelPlan       = null;
}

LoveGame.prototype.paused      = false;
LoveGame.prototype.initialized = false;
LoveGame.prototype.soundEffects= true;
LoveGame.prototype.escapeKey   = false;
LoveGame.prototype.muted       = false;
LoveGame.prototype.slowmotion  = false;
LoveGame.prototype.gameIsOver  = false;

// ─────────────────────────────────────────────
//  LOAD
// ─────────────────────────────────────────────

LoveGame.prototype.load = function() {
	if (this.initialized) return false;
	var self = this;

	this.canvas = document.querySelector(this.canvas);
	if (!this.canvas) {
		this.canvas = document.createElement("canvas");
		document.body.appendChild(this.canvas);
	}
	this.ctx           = this.canvas.getContext("2d");
	this.canvas.height = 400;
	this.canvas.width  = 711;

	// ── Pause menu ──
	var menu = document.createElement("div");
	menu.innerHTML =
		'<div class="spiderman-game-menu-container">' +
			'<div class="spiderman-game-menu-title">PAUSED</div>' +
			'<div class="spiderman-game-menu-button spiderman-game-menu-button-resume">RESUME</div>' +
			'<div class="spiderman-game-menu-button spiderman-game-menu-button-mute-sounds">MUTE SOUNDS</div>' +
			'<div class="spiderman-game-menu-button spiderman-game-menu-button-mute-music">MUTE MUSIC</div>' +
			'<div class="spiderman-game-menu-button spiderman-game-menu-button-mute-slowmotion">TOGGLE SLOWMOTION</div>' +
		'</div>';
	menu = menu.firstChild;
	menu.style.display = "none";
	menu.querySelector(".spiderman-game-menu-button-resume").onclick = function() { self.unpause(); };
	menu.querySelector(".spiderman-game-menu-button-mute-sounds").onclick = function() {
		self.soundEffects = !self.soundEffects;
		this.innerHTML = self.soundEffects ? "MUTE SOUNDS" : "UNMUTE SOUNDS";
	};
	menu.querySelector(".spiderman-game-menu-button-mute-music").onclick = function() {
		if (self.muted) { self.unmute(); this.innerHTML = "MUTE MUSIC"; }
		else { self.mute(); this.innerHTML = "UNMUTE MUSIC"; }
	};
	menu.querySelector(".spiderman-game-menu-button-mute-slowmotion").onclick = function() {
		self.setSlowmotion(!self.slowmotion);
	};
	document.body.appendChild(menu);
	this.pauseMenu = menu;

	// ── Game Over menu ──
	var gameoverMenu = document.createElement("div");
	gameoverMenu.innerHTML =
		'<div class="spiderman-game-menu-container">' +
			'<div class="spiderman-game-menu-title">GAME OVER</div>' +
			'<div class="spiderman-game-menu-title">FINAL SCORE: <span class="spiderman-game-score">0</span></div>' +
			'<div class="spiderman-game-menu-button spiderman-game-menu-button-restart">RESTART</div>' +
		'</div>';
	gameoverMenu = gameoverMenu.firstChild;
	gameoverMenu.querySelector(".spiderman-game-menu-button-restart").onclick = function() {
		var wasLevelMode = self.levelManager && self.levelManager.mode === 'LEVELS';
		var wasLevel     = wasLevelMode ? self.levelManager.current : null;
		self.restart();
		if (wasLevelMode && wasLevel) {
			self.levelManager.startLevel(wasLevel);
			self.progressBar && self.progressBar.show();
		}
		self.update();
	};
	document.body.appendChild(gameoverMenu);
	this.gameoverMenu = gameoverMenu;

	// ── SpiderMan ──
	var spiderman = new SpiderMan(this);
	this.spiderman = spiderman;

	// ── Keyboard ──
	document.addEventListener("keydown", function(e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode == KEY_CODE.ESC && !self.escapeKey) {
			self.escapeKey = true;
			self.paused ? self.unpause() : self.pause();
		}
		if (self.gameIsOver && keyCode == KEY_CODE.SPACEBAR) {
			var wasLevelMode = self.levelManager && self.levelManager.mode === 'LEVELS';
			var wasLevel     = wasLevelMode ? self.levelManager.current : null;
			self.restart();
			if (wasLevelMode && wasLevel) {
				self.levelManager.startLevel(wasLevel);
				self.progressBar && self.progressBar.show();
			}
			self.update();
			return;
		}
		self.spiderman.keydown(keyCode);
	});
	document.addEventListener("keyup", function(e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode == KEY_CODE.ESC) self.escapeKey = false;
		self.spiderman.keyup(keyCode);
	});
	window.addEventListener("resize", function() {
		if (self.paused)     self.showPauseMenu();
		if (self.gameIsOver) self.showGameoverMenu();
	});

	// ── Audio loop chain ──
	for (var i = 0; i < AUDIO_LOOP.length; i++) {
		var soundName = AUDIO_LOOP[i];
		var sound = AUDIO_RESOURCES[soundName];
		sound.setAttribute("data-name", soundName);
		sound.ontimeupdate = function() {
			if (this.currentTime >= this.duration) {
				var current = AUDIO_LOOP.indexOf(this.getAttribute("data-name"));
				var next    = (current + 1) % AUDIO_LOOP.length;
				self.playSound(AUDIO_LOOP[next], false, 0);
			}
		};
	}

	// ── Loading splash ──
	this.canvas.style.backgroundColor = "black";
	this.ctx.font      = "30px Helvetica";
	this.ctx.textAlign = "center";
	this.ctx.fillStyle = "white";
	this.ctx.fillText("Loading...", this.canvas.width / 2, this.canvas.height / 2);

	// ── Progress bar ──
	this.progressBar = new ProgressBar(this);

	return new Promise(function(resolve, reject) {
		var resourcesArray = [];
		for (var resource in RESOURCES) {
			resourcesArray.push({ name: resource, source: RESOURCES_FOLDER_PATH + RESOURCES[resource] });
		}
		var index = 0;

		function loadNext() {
			if (!resourcesArray[index]) {
				var roof = new Roof(self, 0);
				self.scene.spiderman = spiderman;
				self.scene.roofs     = [roof];
				self.gameModeManager = new GameModeManager(self);
				self.levelManager    = new LevelManager(self);
				self.gameModeManager.showMenu();
				if (self.muted) self.mute();
				return resolve();
			}
			var resource = resourcesArray[index];
			var img      = new Image();
			if ('decoding' in img) img.decoding = 'async';
			img.onload = function() {
				self.resources[resource.name] = img;
				index++;
				loadNext();
			};
			img.onerror = function() {
				console.warn("Resource failed to load:", resource.source);
				self.resources[resource.name] = null;
				index++;
				loadNext();
			};
			img.src = resource.source;
		}
		loadNext();
	});
};

// ─────────────────────────────────────────────
//  AUDIO / SLOWMO
// ─────────────────────────────────────────────

LoveGame.prototype.setSlowmotion = function(slowmo) {
	this.slowmotion = slowmo;
	if (slowmo) {
		window.requestAnimFrame = function(cb) { setTimeout(cb, 1000 / 10); };
		for (var a in AUDIO_RESOURCES) AUDIO_RESOURCES[a].playbackRate = 0.5;
	} else {
		window.requestAnimFrame = requestAnimationFrame;
		for (var a in AUDIO_RESOURCES) AUDIO_RESOURCES[a].playbackRate = 1;
	}
};
LoveGame.prototype.mute   = function() { this.muted = true;  for (var a in AUDIO_RESOURCES) AUDIO_RESOURCES[a].volume = 0; };
LoveGame.prototype.unmute = function() { this.muted = false; for (var a in AUDIO_RESOURCES) AUDIO_RESOURCES[a].volume = 1; };

LoveGame.prototype.playSound = function(audio, clone, currentTime) {
	audio = audio && audio.play ? audio : AUDIO_RESOURCES[audio];
	if (audio && audio.play) {
		if (clone) audio = audio.cloneNode(true);
		if (currentTime != undefined) audio.currentTime = currentTime;
		return audio.play();
	}
};
LoveGame.prototype.pauseSound = function(audio) {
	if (audio && audio.pause) return audio.pause();
	if (AUDIO_RESOURCES[audio]) AUDIO_RESOURCES[audio].pause();
};

// ─────────────────────────────────────────────
//  MENU HELPERS
// ─────────────────────────────────────────────

LoveGame.prototype.showPauseMenu = function() {
	if (this.gameoverMenu.style.display === "block") return;
	var rect = this.canvas.getBoundingClientRect();
	this.pauseMenu.style.display = "block";
	this.pauseMenu.style.left    = (rect.left + this.canvas.width  / 2) + "px";
	this.pauseMenu.style.top     = (rect.top  + this.canvas.height / 2) + "px";
};
LoveGame.prototype.showGameoverMenu = function() {
	this.gameoverMenu.querySelector(".spiderman-game-score").innerHTML = this.score;
	var rect = this.canvas.getBoundingClientRect();
	this.gameoverMenu.style.display = "block";
	this.gameoverMenu.style.left    = (rect.left + this.canvas.width  / 2) + "px";
	this.gameoverMenu.style.top     = (rect.top  + this.canvas.height / 2) + "px";
};

LoveGame.prototype.pause   = function() { this.paused = true;  this.showPauseMenu(); };
LoveGame.prototype.unpause = function() {
	this.paused = false;
	this.pauseMenu.style.display = "none";
	this.update();
};

// ─────────────────────────────────────────────
//  GAME MODE ENTRY POINTS
// ─────────────────────────────────────────────

LoveGame.prototype.startFreePlay = function() {
	this.gameModeManager && this.gameModeManager.hide();
	if (!this.levelManager) this.levelManager = new LevelManager(this);
	this.levelManager.active = false;
	this.progressBar && this.progressBar.hide();
	this.playSound(AUDIO_LOOP[0], false, 0);
	this.update();
};

LoveGame.prototype.startLevel = function(levelId) {
	if (!this.levelManager) this.levelManager = new LevelManager(this);
	this.levelManager.startLevel(levelId);
	this.progressBar && this.progressBar.show();
	this.playSound(AUDIO_LOOP[0], false, 0);
	this.update();
};

// ─────────────────────────────────────────────
//  NOTIFICATION (small toast)
// ─────────────────────────────────────────────

LoveGame.prototype.showNotification = function(text, timeout, colour) {
	timeout = timeout || 1400;
	colour  = colour  || 'rgba(255,220,0,0.95)';

	var el  = document.createElement('div');
	var rect = this.canvas.getBoundingClientRect();
	Object.assign(el.style, {
		position   : 'fixed',
		left       : (rect.left + this.canvas.width / 2) + 'px',
		top        : (rect.top  + 54) + 'px',
		transform  : 'translateX(-50%)',
		zIndex     : '10003',
		background : colour,
		color      : '#000',
		padding    : '6px 16px',
		borderRadius: '20px',
		fontFamily : 'LoveGamePixelFont, monospace',
		fontSize   : '12px',
		fontWeight : 'bold',
		boxShadow  : '0 2px 12px rgba(0,0,0,0.5)',
		pointerEvents: 'none',
		whiteSpace : 'nowrap',
	});
	el.innerText = text;
	document.body.appendChild(el);

	// fade-out
	var start = null;
	var fadeDuration = 350;
	var holdDuration = timeout - fadeDuration;

	function step(ts) {
		if (!start) start = ts;
		var elapsed = ts - start;
		if (elapsed < holdDuration) {
			requestAnimFrame(step);
		} else {
			var fadeElapsed = elapsed - holdDuration;
			el.style.opacity = Math.max(0, 1 - fadeElapsed / fadeDuration);
			if (fadeElapsed < fadeDuration) {
				requestAnimFrame(step);
			} else {
				if (el.parentNode) el.parentNode.removeChild(el);
			}
		}
	}
	requestAnimFrame(step);
};

// ─────────────────────────────────────────────
//  DRAW HELPERS
// ─────────────────────────────────────────────

LoveGame.prototype.drawBackground = function() {
	var bg  = this.resources.BACKGROUND;
	if (!bg) return;
	var x   = (this.cameraX / 5 * -1) % Math.min(bg.width, this.canvas.width);
	var ratio = bg.width / bg.height;
	var w   = this.canvas.height * ratio;
	this.ctx.drawImage(bg, x,     0, w, this.canvas.height);
	this.ctx.drawImage(bg, x + w, 0, w, this.canvas.height);
};

LoveGame.prototype.drawGrabPoints = function() {
	var gps = this.scene.grabPoints || [];
	for (var i = 0; i < gps.length; i++) gps[i].update();
};

LoveGame.prototype.drawPlatforms = function() {
	var plats = this.scene.platforms || [];
	for (var i = 0; i < plats.length; i++) plats[i].update();
};

LoveGame.prototype.drawRoofs = function() {
	var roofs = this.scene.roofs;
	for (var i = 0; i < roofs.length; i++) roofs[i].update();
	// keep at least 3 roofs ahead — only in infinite/level1 mode
	if (roofs.length < 3 && !(this.levelManager && this.levelManager.current === 2)) {
		var last = roofs[roofs.length - 1];
		if (last) {
			var x    = last.x + last.fullWidth + Math.round(Math.random() * 50) + 100;
			var roof = new Roof(this, x);
			this.addRoof(roof);
		}
	}
};

LoveGame.prototype.drawEnemies = function() {
	var enemies = this.scene.enemies;
	for (var i = 0; i < enemies.length; i++) enemies[i].update();
};

LoveGame.prototype.drawItems = function() {
	var items = this.scene.items || [];
	for (var i = 0; i < items.length; i++) {
		if (items[i] && typeof items[i].update === 'function') items[i].update();
	}
};

// ─────────────────────────────────────────────
//  MAIN UPDATE LOOP
// ─────────────────────────────────────────────

LoveGame.prototype.update = function() {
	if (this.paused || this.gameIsOver) return;

	var scene      = this.scene;
	var spiderman  = scene.spiderman;
	var projectiles= scene.projectiles;

	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.drawBackground();
	this.drawRoofs();
	this.drawPlatforms();
	this.drawGrabPoints();
	this.drawEnemies();
	this.drawItems();

	for (var i = 0; i < projectiles.length; i++) projectiles[i].update();

	spiderman.update();

	// Score display
	this.ctx.fillStyle    = "white";
	this.ctx.font         = "20px LoveGamePixelFont, Monospace, Helvetica";
	this.ctx.textAlign    = "center";
	this.ctx.textBaseline = "top";
	this.ctx.fillText(this.score, this.canvas.width / 2, 5);

	// Projectile ↔ character collision
	for (var i = 0; i < projectiles.length; i++) {
		var p   = projectiles[i];
		var chr = this.isCharacterAtPoint(p.x, p.y);
		if (chr) {
			p.handleHitWithCharacter(chr);
			chr.handleHitWithProjectile(p);
		}
	}

	this.checkItemCollisions();

	// Progress bar (levels mode only)
	if (this.levelManager && this.levelManager.active) {
		if (this.progressBar) {
			this.progressBar.update(
				spiderman.x,
				this.levelManager.levelStartX,
				this.levelManager.levelEndX
			);
		}

		// Key icon in top-left when in levels mode
		this._drawKeyHUD();
	}

	requestAnimFrame(this.update.bind(this));
};

LoveGame.prototype._drawKeyHUD = function() {
	var ctx    = this.ctx;
	var keyImg = this.resources.KEY;
	if (!keyImg) return;

	var size  = 22;
	var x     = 8;
	var y     = 8;
	ctx.save();

	if (this.hasKey) {
		ctx.shadowColor = 'rgba(255,220,0,0.9)';
		ctx.shadowBlur  = 8;
		ctx.globalAlpha = 1;
	} else {
		ctx.globalAlpha = 0.25;
	}

	ctx.drawImage(keyImg, x, y, size, size);
	ctx.restore();
};

// ─────────────────────────────────────────────
//  SCENE MANAGEMENT
// ─────────────────────────────────────────────

LoveGame.prototype.addProjectile    = function(p) { if (p instanceof Projectile) this.scene.projectiles.push(p); };
LoveGame.prototype.removeProjectile = function(p) { var a = this.scene.projectiles; var i = a.indexOf(p); if (i > -1) a.splice(i, 1); };
LoveGame.prototype.addEnemy         = function(e) { if (e) this.scene.enemies.push(e); };
LoveGame.prototype.removeEnemy      = function(e) {
	var a = this.scene.enemies;
	var i = a.indexOf(e);
	if (i > -1) {
		try { if (e && e.domImg && e.domImg.parentNode) { e.domImg.parentNode.removeChild(e.domImg); e.domImg = null; } } catch(x) {}
		a.splice(i, 1);
	}
};
LoveGame.prototype.addItem    = function(it) { if (!this.scene.items) this.scene.items = []; this.scene.items.push(it); };
LoveGame.prototype.removeItem = function(it) { var a = this.scene.items || []; var i = a.indexOf(it); if (i > -1) a.splice(i, 1); };
LoveGame.prototype.addRoof    = function(r) { if (r instanceof Roof) this.scene.roofs.push(r); };
LoveGame.prototype.removeRoof = function(r) { var a = this.scene.roofs; var i = a.indexOf(r); if (i > -1) a.splice(i, 1); };

// ─────────────────────────────────────────────
//  SPATIAL QUERIES
// ─────────────────────────────────────────────

LoveGame.prototype.isRoofAtPoint = function(x, y) {
	// x is in world coords — do NOT subtract cameraX here
	// Check roofs (buildings) — player can land on top surface
	for (var i = 0; i < this.scene.roofs.length; i++) {
		var roof = this.scene.roofs[i];
		if (roof.x <= x && roof.x + roof.fullWidth >= x && y >= roof.y) return roof;
	}
	// Check floating platforms — ONLY land from above (not clip through from below)
	var plats = this.scene.platforms || [];
	for (var j = 0; j < plats.length; j++) {
		var pl = plats[j];
		// x range check
		if (pl.x > x || pl.x + pl.width < x) continue;
		// only land when feet are at or just below platform top (not rising through from below)
		if (y >= pl.y && y <= pl.y + pl.height + 6) return pl;
	}
	return false;
};

LoveGame.prototype.isCharacterAtPoint = function(x, y) {
	var characters = this.scene.enemies.concat(this.spiderman);
	x -= this.cameraX;
	for (var i = 0; i < characters.length; i++) {
		var chr   = characters[i];
		var img   = chr.stateImg || {};
		var left  = chr.x - this.cameraX;
		var top   = chr.y;
		var right = left + img.width  * chr.scale;
		var bot   = top  + img.height * chr.scale;
		if (left <= x && top <= y && right >= x && bot >= y) return chr;
	}
	return false;
};

// ─────────────────────────────────────────────
//  ITEM COLLISION  (key pickup + door)
// ─────────────────────────────────────────────

LoveGame.prototype.checkItemCollisions = function() {
	var items = this.scene.items || [];
	var sp    = this.spiderman;
	if (!sp) return;

	// Use world-space X for everything (no cameraX subtraction)
	var spImg    = sp.stateImg || { width: 60, height: 80 };
	var spW      = (spImg.width  || 60) * sp.scale;
	var spH      = (spImg.height || 80) * sp.scale;
	var spLeft   = sp.x;
	var spRight  = sp.x + spW;
	var spTop    = sp.y;
	var spBot    = sp.y + spH;

	for (var i = items.length - 1; i >= 0; i--) {
		var it = items[i];
		if (!it) continue;

		// ── Key pickup ──
		if (it instanceof Key && !it.collected) {
			var kImg  = it.stateImg || { width: 100, height: 50 };
			var kW    = (kImg.width  || 100) * it.scale;
			var kH    = (kImg.height || 50)  * it.scale;
			var kLeft = it.x;
			var kRight= it.x + kW;
			var kTop  = it.y;
			var kBot  = it.y + kH;

			var kHit = !(spRight < kLeft || spLeft > kRight || spBot < kTop || spTop > kBot);
			if (kHit) {
				this.hasKey = true;
				it.collected = true;
				this.removeItem(it);
				try { this.playSound('PICKUP', true, 0); } catch(e) {}
				this.showNotification('🗝️  Key Collected!', 1600, 'rgba(255,220,0,0.95)');
			}
		}

		// ── Door interaction ──
		if (it instanceof Door && !it.hidden) {
			// Use simple proximity: player right edge within 60px of door left edge
			var dImg   = it.closedImg || { width: 64, height: 96 };
			var dW     = (dImg.width  || 64) * it.scale;
			var dLeft  = it.x;
			var dRight = it.x + dW;

			var nearDoor = spRight >= dLeft - 20 && spLeft <= dRight;
			if (nearDoor) {
				if (!this.hasKey) {
					var now = Date.now();
					if (!this._lastNoKeyMsg || now - this._lastNoKeyMsg > 1000) {
						this._lastNoKeyMsg = now;
						this.showNotification('🔒  Find the key first!', 1200, 'rgba(255,60,60,0.95)');
					}
				} else if (!this._completingLevel) {
					this._completingLevel = true;
					it.open = true;
					try { this.playSound('PICKUP', true, 0); } catch(e) {}
					this.showNotification('🚪  Door opened!', 1200, 'rgba(60,255,60,0.95)');
					// Freeze player just outside door
					sp.velocityX = 0;
					sp.velocityY = 0;
					sp.x = dLeft - spW - 2;
					if (this.levelManager) this.levelManager.levelEndX = dRight;
					var self = this;
					setTimeout(function() {
						if (self.levelManager && !self.gameIsOver) self.levelManager.completeLevel();
					}, 800);
				}
			}
		}
	}
};

// ─────────────────────────────────────────────
//  RESTART
// ─────────────────────────────────────────────

LoveGame.prototype.restart = function() {
	// clean up enemy DOM overlays
	if (this.scene && this.scene.enemies) {
		for (var i = 0; i < this.scene.enemies.length; i++) {
			var e = this.scene.enemies[i];
			try { if (e && e.domImg && e.domImg.parentNode) { e.domImg.parentNode.removeChild(e.domImg); e.domImg = null; } } catch(x) {}
		}
	}

	this.roofCount = 0;
	this.spiderman = new SpiderMan(this);
	this.scene.spiderman  = this.spiderman;
	this.scene.projectiles= [];
	this.scene.roofs      = [new Roof(this, 0)];
	this.scene.enemies    = [];
	this.scene.items      = [];
	this.scene.platforms  = [];
	this.scene.grabPoints = [];
	this.cameraX          = 0;
	this.score            = 0;
	this.hasKey           = false;
	this.levelComplete    = false;
	this._levelDoor       = null;
	this.levelPlan        = null;
	this._lastNoKeyMsg    = null;
	this._completingLevel = false;

	this.paused    = false;
	this.gameIsOver= false;

	this.gameoverMenu.style.display = "none";
	this.pauseMenu.style.display    = "none";

	this.progressBar && this.progressBar.hide();
};

LoveGame.prototype.gameover = function() {
	this.gameIsOver = true;
	this.showGameoverMenu();
};

// ─────────────────────────────────────────────
//  SPAWN LEVEL
// ─────────────────────────────────────────────

LoveGame.prototype.spawnLevel = function(level) {
	this.scene.items     = [];
	this.scene.platforms = [];
	this.hasKey          = false;
	this.levelComplete   = false;
	this._levelDoor      = null;
	this._lastNoKeyMsg   = null;
	this._completingLevel= false;

	if (level === 1) {
		var base  = this.roofCount || 1;
		var ahead = Math.floor(Math.random() * 3) + 8; // 8-10 roofs ahead
		var doorIndex = base + ahead;
		var keyIndex  = base + Math.floor(Math.random() * (ahead - 2)) + 2;

		this.levelPlan = {
			keyRoofIndex : keyIndex,
			doorRoofIndex: doorIndex,
		};

		// No pre-created door — door is created directly in Roof.update when the right roof generates
		this._levelDoor = null;

		if (this.levelManager) {
			this.levelManager.levelEndX = null;
			this.levelManager.keyX      = null;
		}
	}

	if (level === 2) {
		this._spawnLevel2();
	}
};

LoveGame.prototype._spawnLevel2 = function() {
	var ch = this.canvas.height;  // 400
	var lm = this.levelManager;

	var WORLD_W  = 2000;
	var JUMP_H   = 130; // safe max jump height in pixels (velocityY=-15, gravity=0.7 → ~160px but use 130 to be safe)

	// ── Clear roofs — Level 2 uses platforms only ──
	this.scene.roofs = [];
	this.roofCount   = 0;

	// Platform height: use a slice of building.png (same as Level 1 roofs)
	// building.png is 844×673. We render platforms at height=80 (a visible chunk)
	var PLAT_H = 80;

	// Ground floor Y — bottom platforms sit flush with canvas bottom
	var groundY = ch - PLAT_H;

	// ── Platform layout ──
	// Each platform defined as { x, y, w }
	// Gaps between platforms ≤ 160px horizontal, height diff ≤ JUMP_H
	// Player starts on left ground. Must reach right ground.
	var platDefs = [
		// Left ground floor
		{ x: 0,    y: groundY, w: 200 },
		// Stepping platforms going right, varying heights
		{ x: 250,  y: groundY - 80,  w: 180 },
		{ x: 470,  y: groundY - 150, w: 160 },   // key platform
		{ x: 670,  y: groundY - 70,  w: 170 },
		{ x: 880,  y: groundY - 120, w: 150 },
		{ x: 1070, y: groundY - 50,  w: 180 },
		{ x: 1290, y: groundY - 110, w: 160 },
		{ x: 1490, y: groundY - 60,  w: 170 },
		{ x: 1700, y: groundY - 120, w: 180 },
		// Right ground floor
		{ x: WORLD_W - 220, y: groundY, w: 220 },
	];

	// Build and register platforms
	for (var i = 0; i < platDefs.length; i++) {
		var pd = platDefs[i];
		var pl = new Platform(this, {
			x: pd.x, y: pd.y, width: pd.w, height: PLAT_H
		});
		this.scene.platforms.push(pl);
	}

	// ── Start door — left ground floor, already open ──
	var doorScale  = 0.45;
	var doorImgW   = (this.resources.DOOR_OPENED || { width: 350 }).width;
	var startDoor  = new Door(this, {
		x: 20, y: groundY, scale: doorScale, hidden: false,
	});
	startDoor.open = true;
	this.addItem(startDoor);

	// ── Key — on platform index 2 (the mid-height one) ──
	var keyScale = 0.04;
	var keyImgW  = (this.resources.KEY || { width: 754 }).width;
	var keyImgH  = (this.resources.KEY || { height: 350 }).height;
	var kw = keyImgW * keyScale;
	var kh = keyImgH * keyScale;
	var kp = platDefs[2];
	var key = new Key(this, {
		x    : kp.x + kp.w / 2 - kw / 2,
		y    : kp.y - kh - 10,
		scale: keyScale,
	});
	this.addItem(key);
	if (lm) lm.keyX = key.x;

	// ── Exit door — right ground floor ──
	var exitDoorImgW = (this.resources.DOOR_CLOSED || { width: 350 }).width;
	var exitDoor = new Door(this, {
		x    : WORLD_W - 200,
		y    : groundY,
		scale: doorScale,
		hidden: false,
	});
	this.addItem(exitDoor);
	this._levelDoor = exitDoor;
	if (lm) {
		lm.levelEndX   = WORLD_W - 170;
		lm.levelStartX = 0;
	}

	// ── Enemies — use IntroSpawner so fly-in animation plays, on platforms 1,3,5,7 ──
	var enemyOnPlats = [1, 3, 5, 7];
	for (var ei = 0; ei < enemyOnPlats.length; ei++) {
		var ep = platDefs[enemyOnPlats[ei]];
		var fakeRoof = { x: ep.x, y: ep.y, width: ep.w, fullWidth: ep.w };
		// Fly in from left edge of each platform (same as Level 1 IntroSpawner behaviour)
		var spawner = new IntroSpawner(this, {
			roof   : fakeRoof,
			targetX: ep.x + ep.w / 2,
			y      : ep.y,   // feet land on platform top
			speed  : 2,
		});
		// Start spawner off-screen left of this platform
		spawner.x = ep.x - 250;
		this.addEnemy(spawner);
	}

	// ── Ceiling bars — wide horizontal bars in every gap between platforms ──
	// Player jumps up to grab them, hangs upside-down, walks across, drops onto next platform
	// Bar Y = 60px from top of canvas so it's clearly visible above platforms
	var BAR_Y = 55;
	var grabDefs = [
		// gap between plat 0 (ends x=200) and plat 1 (starts x=250): bar covers gap
		{ x: 195,  w: 65,  y: BAR_Y },
		// gap between plat 1 (ends 430) and plat 2 (starts 470)
		{ x: 425,  w: 55,  y: BAR_Y },
		// gap between plat 2 (ends 630) and plat 3 (starts 670)
		{ x: 625,  w: 55,  y: BAR_Y },
		// gap between plat 3 (ends 840) and plat 4 (starts 880)
		{ x: 835,  w: 55,  y: BAR_Y },
		// gap between plat 4 (ends 1030) and plat 5 (starts 1070)
		{ x: 1025, w: 55,  y: BAR_Y },
		// gap between plat 5 (ends 1250) and plat 6 (starts 1290)
		{ x: 1245, w: 55,  y: BAR_Y },
		// gap between plat 6 (ends 1450) and plat 7 (starts 1490)
		{ x: 1445, w: 55,  y: BAR_Y },
		// gap between plat 7 (ends 1660) and plat 8 (starts 1700)
		{ x: 1655, w: 55,  y: BAR_Y },
		// gap between plat 8 (ends 1880) and right floor (starts 1780)
		{ x: 1875, w: 55,  y: BAR_Y },
	];
	this.scene.grabPoints = [];
	for (var gi = 0; gi < grabDefs.length; gi++) {
		var gd = grabDefs[gi];
		this.scene.grabPoints.push(new GrabPoint(this, {
			x: gd.x, y: gd.y, width: gd.w
		}));
	}

	// ── Place player on left ground floor ──
	var sp = this.spiderman;
	var spH = (sp.stateImg || { height: 80 }).height * sp.scale;
	sp.x = 120;
	sp.y = groundY - spH + (sp.footOffset || 0);
	sp.velocityX = 0;
	sp.velocityY = 0;
	this.cameraX  = 0;
};

// ─────────────────────────────────────────────
//  SPIDERMAN
// ─────────────────────────────────────────────

function SpiderMan(game) {
	this.game   = game;
	this.canvas = game.canvas;
	this.ctx    = game.ctx;
	this.name   = "SPIDER_MAN";
	this.x      = 0;
	this.y      = 0;
	this.states = ["STANDING"];
	this.scale  = 0.5;
	this.keydowns = [];
	this.health   = 5;
	this.maxHealth= 5;
	this.web      = 50;
	this.velocityX= 0;
	this.velocityY= 0;
	this.regenerationSpeed = 1200;
	this.frame    = 0;
	this.runningFrames        = ["RUNNING_RIGHT_STEP","RUNNING_CHANGE_STEP","RUNNING_LEFT_STEP","RUNNING_CHANGE_STEP"];
	this.runningShootingFrames= ["SHOOT_RIGHT-STEP","SHOOT_CHANGE_STEP","SHOOT_LEFT-STEP","SHOOT_CHANGE_STEP"];
	this.runningFrame    = 0;
	this.gravityForce    = 0.7;
	this.runningDirection= 0;
	this.runningSpeed    = 3;
	this.shootingFrame   = 0;
	this.wasDamagedOnPreviousFrame = false;
	this.footOffset = 6;
	// hanging / rope mechanic
	this._hangPoint   = null;  // current GrabPoint being held
	this._hangOffset  = 0;     // how far down the rope (0=top, ropeH=bottom)
	this._hangSwingX  = 0;     // horizontal swing velocity while hanging
}

SpiderMan.prototype.keyIsDown  = function(kc) { return this.keydowns.indexOf(kc) > -1; };
SpiderMan.prototype.hasState   = function(s)  { return this.states.indexOf(s) > -1; };
SpiderMan.prototype.addState   = function(s)  { if (!this.hasState(s)) this.states.push(s); };
SpiderMan.prototype.removeState= function(s) {
	if (s instanceof Array) { for (var i = 0; i < s.length; i++) this.removeState(s[i]); return; }
	var i = this.states.indexOf(s);
	if (i > -1) this.states.splice(i, 1);
};

SpiderMan.prototype.handleHitWithProjectile = function(p) {
	if (p.name !== "WEB") { this.health -= p.damage; this.wasDamagedOnPreviousFrame = true; }
};

SpiderMan.prototype.stateImage = function() {
	var state = "STANDING";

	if (this.hasState("JUMP")) {
		state = "JUMP";
		if (this.velocityY === 0) {
			this.velocityY = -15;
			if (this.game.soundEffects) this.game.playSound("JUMP", true, 0);
			if (this.runningDirection && Math.abs(this.runningDirection) === 1) {
				this.velocityX = this.runningDirection * Math.max(Math.abs(this.velocityX), 2);
			}
		}
	}
	if (this.velocityY >= 0) this.removeState("JUMP");

	if (this.hasState("DOWN")) {
		state = "DOWN";
	}

	if (this.hasState("RUNNING")) {
		state = this.runningFrames[this.runningFrame];
		if (this.hasState("SHOOT")) state = this.runningShootingFrames[this.runningFrame];
		if (this.frame % 10 === 0) {
			this.runningFrame++;
			this.runningFrame %= this.runningFrames.length - 1;
		}
		this.velocityX = this.runningDirection * this.runningSpeed;
	} else {
		this.velocityX = this.hasState("JUMP") ? this.velocityX * 0.99 : 0;
	}

	if (this.hasState("SHOOT")) {
		if (!this.hasState("RUNNING")) state = "SHOOT";
		if (this.shootingFrame % 20 === 0) this.shoot(this.game.resources.SHOOT);
		this.shootingFrame++;
	}

	var image = this.game.resources[state] || this.game.resources["STANDING"];
	this.stateImg = image;
	return image;
};

SpiderMan.prototype.keydown = function(kc) {
    this.keydowns.push(kc);
    if (kc === KEY_CODE.ARROW_DOWN) this.addState("DOWN");
};

SpiderMan.prototype.keyup   = function(kc) {
	this.runningFrame = 0;
	if (kc === KEY_CODE.ARROW_DOWN) this.removeState("DOWN");
	if (kc === KEY_CODE.ARROW_RIGHT || kc === KEY_CODE.ARROW_LEFT) this.removeState("RUNNING");
	if (kc === KEY_CODE.SPACEBAR) { this.removeState("SHOOT"); this.shootingFrame = 0; }
	while (this.keydowns.indexOf(kc) > -1) this.keydowns.splice(this.keydowns.indexOf(kc), 1);
};

SpiderMan.prototype._releaseHang = function(jumpVelocityY) {
	// Jump or drop off ceiling bar — carry the walking direction as horizontal momentum
	this.velocityY = (typeof jumpVelocityY === 'number') ? jumpVelocityY : 2;
	this.velocityX = this.runningDirection === DIRECTION.RIGHT ? 3 :
	                 this.runningDirection === DIRECTION.LEFT  ? -3 : 0;
	this._hangPoint  = null;
	this._hangOffset = 0;
	this._hangSwingX = 0;
};

SpiderMan.prototype.regenerate = function() {
	if (this.frame % this.regenerationSpeed === 0 && this.health < this.maxHealth)
		this.health = Math.round(this.health + 1);
};

SpiderMan.prototype.shoot = function(img) {
	if (this.web <= 0) return;
	var direction = this.runningDirection || 1;
	var web       = new Projectile(this.game);
	web.name      = "WEB";
	web.damage    = 2;
	web.x = this.x + img.width * this.scale + 1;
	if (this.runningDirection === DIRECTION.LEFT) web.x = this.x - 1;
	web.y = this.y + img.height * this.scale / 2;

	web.update = function() {
		var x = this.x - this.game.cameraX;
		var y = this.y;
		if (direction === DIRECTION.LEFT) x -= 20;
		this.ctx.drawImage(this.game.resources["WEB_PROJECTILE"], x, y - 10, 20, 20);
		this.x += direction * 6;
		if (this.x - this.game.cameraX >= this.canvas.width || this.x <= 0) this.remove();
	};
	web.handleHitWithCharacter = function(chr) {
		if (chr.name !== "SPIDER_MAN") return this.remove();
	};
	web.spiderman = this;
	this.game.addProjectile(web);
	if (this.game.soundEffects) this.game.playSound("SHOOT", true, 0);
	this.web--;
};

SpiderMan.prototype.drawHealthbar = function() {
	var hw = 25, hh = 25;
	for (var i = 0; i < this.health; i++) {
		var x = i * hw + 5 * (i + 1);
		this.ctx.drawImage(this.game.resources.HEART, x, 5, hw, hh);
	}
};

SpiderMan.prototype.drawWebbar = function() {
	var img    = this.game.resources.WEB_PROJECTILE;
	var string = "X " + this.web;
	this.ctx.fillStyle    = "white";
	this.ctx.font         = "15px LoveGamePixelFont, Monospace, Arial";
	this.ctx.textAlign    = "start";
	this.ctx.textBaseline = "top";
	var ww = 20, wh = 20;
	var tw = this.ctx.measureText(string).width;
	var hp = 10, vp = 5;
	var x  = this.canvas.width - ww - tw - hp * 2;
	var y  = vp;
	this.ctx.drawImage(img, x, y, ww, wh);
	this.ctx.fillText(string, x + ww + hp, y);
};

SpiderMan.prototype.update = function() {
	// Freeze all input when completing level
	if (this.game._completingLevel) {
		this.velocityX = 0;
		this.removeState("RUNNING");
		this.removeState("JUMP");
		this.removeState("FALL");
		this.removeState("HANGING");
		this._hangPoint = null;
		var imgF = this.stateImage();
		var rx = this.x - this.game.cameraX;
		this.ctx.drawImage(imgF, rx, this.y, imgF.width * this.scale, imgF.height * this.scale);
		return;
	}

	if (this.y >= this.canvas.height || this.health <= 0) {
		this.game.gameover();
	}

	// ── HANGING MODE — gripping a ceiling bar ──
	if (this._hangPoint) {
		var hp  = this._hangPoint;
		var img = this.game.resources["JUMP"] || this.game.resources["STANDING"];
		this.stateImg = img;
		var spW = img.width  * this.scale;
		var spH = img.height * this.scale;

		// LEFT/RIGHT — walk along the bar
		if (this.keyIsDown(KEY_CODE.ARROW_RIGHT)) {
			this._hangOffset = Math.min(this._hangOffset + 2.5, hp.width - spW);
			this.runningDirection = DIRECTION.RIGHT;
		} else if (this.keyIsDown(KEY_CODE.ARROW_LEFT)) {
			this._hangOffset = Math.max(this._hangOffset - 2.5, 0);
			this.runningDirection = DIRECTION.LEFT;
		}

		// Snap player position — hands at bar, body hangs below
		this.x = hp.x + this._hangOffset;
		this.y = hp.y + 10; // 10 = bar thickness, player top just below bar

		// DOWN — drop off the bar
		if (this.keyIsDown(KEY_CODE.ARROW_DOWN)) {
			this._releaseHang(0);
			return;
		}

		// UP — jump upward off the bar
		if (this.keyIsDown(KEY_CODE.ARROW_UP)) {
			this._releaseHang(-14);
			return;
		}

		// Draw player flipped upside-down (hanging)
		var ctx = this.ctx;
		var rx  = this.x - this.game.cameraX;
		ctx.save();
		ctx.translate(rx + spW / 2, this.y + spH / 2);
		ctx.scale(
			this.runningDirection === DIRECTION.LEFT ? -1 : 1,
			-1   // flip vertically = upside-down
		);
		ctx.drawImage(img, -spW / 2, -spH / 2, spW, spH);
		ctx.restore();

		if (this.wasDamagedOnPreviousFrame) {
			this.wasDamagedOnPreviousFrame = false;
			ctx.fillStyle = "rgba(0,0,0,0.2)";
			ctx.fillRect(rx, this.y, spW, spH);
		}

		this.regenerate();
		this.drawHealthbar();
		this.drawWebbar();
		this.frame++;
		return;
	}

	// ── NORMAL MODE ──
	if (!this.game._completingLevel) {
		if (this.keyIsDown(KEY_CODE.ARROW_UP) && !this.hasState("FALL")) this.addState("JUMP");
		if (this.keyIsDown(KEY_CODE.ARROW_RIGHT)) { this.addState("RUNNING"); this.runningDirection = DIRECTION.RIGHT; }
		if (this.keyIsDown(KEY_CODE.ARROW_LEFT))  { this.addState("RUNNING"); this.runningDirection = DIRECTION.LEFT;  }
		if (this.keyIsDown(KEY_CODE.SPACEBAR))    this.addState("SHOOT");
	}

	var img = this.stateImage();

	this.velocityY += this.gravityForce;
	this.y += this.velocityY;
	this.x += this.velocityX;

	// NaN guard
	if (!isFinite(this.x) || isNaN(this.x) || !isFinite(this.y) || isNaN(this.y)) {
		this.velocityX = 0; this.velocityY = 0;
		this.x = Math.max(0, this.game.cameraX + 50);
		this.y = Math.min(this.canvas.height - 32, Math.max(0, this.y || (this.canvas.height - 100)));
	}

	// world bounds
	var maxWorldX = Infinity;
	try {
		if (this.game.levelManager && this.game.levelManager.levelEndX)
			maxWorldX = this.game.levelManager.levelEndX + 10;
	} catch(e) {}
	if (this.x < 0) this.x = 0;
	if (this.x > maxWorldX) this.x = maxWorldX;
	if (!isFinite(this.game.cameraX) || isNaN(this.game.cameraX)) this.game.cameraX = 0;

	// ── Camera: scroll only when player crosses the screen midpoint ──
	var midScreen = this.canvas.width / 2;
	var playerScreenX = this.x - this.game.cameraX;
	if (playerScreenX > midScreen) {
		var maxCam = Infinity;
		try {
			var its = this.game.scene.items || [];
			for (var ii = 0; ii < its.length; ii++) {
				if (its[ii] instanceof Door && !its[ii].hidden && (!its[ii].open || this.game._completingLevel)) {
					maxCam = Math.max(0, its[ii].x - (this.canvas.width - 120));
					break;
				}
			}
		} catch(e) {}
		var newCam = this.x - midScreen;
		if (newCam > maxCam) newCam = maxCam;
		if (newCam > this.game.cameraX) this.game.cameraX = newCam;
	}
	if (playerScreenX < midScreen) {
		var newCamL = this.x - midScreen;
		if (newCamL < 0) newCamL = 0;
		if (newCamL < this.game.cameraX) this.game.cameraX = newCamL;
	}

	// block player at closed door
	try {
		var its2 = this.game.scene.items || [];
		for (var j = 0; j < its2.length; j++) {
			var itm = its2[j];
			var doorBlocked = (itm instanceof Door) && !itm.hidden && (!itm.open || this.game._completingLevel);
			if (doorBlocked) {
				var limitX = itm.x - (img.width * this.scale) - 2;
				if (this.x > limitX) { this.x = limitX; this.velocityX = 0; }
				break;
			}
		}
	} catch(e) {}

	// roof/platform collision — only snap when falling downward
	var imgH  = img.height * this.scale;
	var imgW  = img.width  * this.scale;
	if (this.velocityY >= 0) {
		var roofL = this.game.isRoofAtPoint(this.x + imgW * 0.2, this.y + imgH + 1);
		var roofR = this.game.isRoofAtPoint(this.x + imgW * 0.8, this.y + imgH + 1);
		if (roofL || roofR) {
			var surface = roofL || roofR;
			this.y         = surface.y - imgH;
			this.velocityY = 0;
			this.removeState("FALL");
		}
	}

	// ── Ceiling bar detection — jump up into bar to grab it ──
	// Only grab when moving upward (velocityY < 0) and head enters bar zone
	if (this.velocityY < 0) {
		var gps = this.game.scene.grabPoints || [];
		for (var gi = 0; gi < gps.length; gi++) {
			var gp   = gps[gi];
			var imgH2 = img.height * this.scale;
			var imgW2 = img.width  * this.scale;
			var headY = this.y;           // player top = head
			var midX  = this.x + imgW2 / 2; // player center X
			// head reaches bar level AND player center is within bar horizontal span
			var inBarX = midX >= gp.x && midX <= gp.x + gp.width;
			var hitsBar = headY <= gp.y + 10 && headY >= gp.y - 10;
			if (inBarX && hitsBar) {
				// _hangOffset = how far from bar left edge player is
				this._hangPoint  = gp;
				this._hangOffset = Math.max(0, Math.min(midX - gp.x - imgW2 / 2, gp.width - imgW2));
				this._hangSwingX = 0;
				this.velocityX   = 0;
				this.velocityY   = 0;
				this.removeState("JUMP");
				this.removeState("FALL");
				break;
			}
		}
	}

	var rx = this.x - this.game.cameraX;
	var ry = this.y;
	var rw = imgW;
	var rh = imgH;

	this.ctx.save();
	if (this.runningDirection === DIRECTION.LEFT) {
		this.ctx.scale(-1, 1);
		rx *= -1;
		rx -= rw;
	}
	this.ctx.drawImage(img, rx, ry, rw, rh);
	this.ctx.restore();

	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		this.ctx.fillStyle = "rgba(0,0,0,0.2)";
		this.ctx.fillRect(this.x - this.game.cameraX, ry, rw, rh);
	}

	this.regenerate();
	this.drawHealthbar();
	this.drawWebbar();
	this.frame++;
};

// ─────────────────────────────────────────────
//  PROJECTILE
// ─────────────────────────────────────────────

function Projectile(game) {
	this.x = 0; this.y = 0;
	this.damage = 0;
	this.name   = "UNKNOWN";
	this.canvas = game.canvas;
	this.ctx    = game.ctx;
	this.game   = game;
}
Projectile.prototype.update  = function() {};
Projectile.prototype.remove  = function() { this.game.removeProjectile(this); };
Projectile.prototype.handleHitWithCharacter = function() { this.remove(); };

// ─────────────────────────────────────────────
//  ROOF
// ─────────────────────────────────────────────

function Roof(game, x, y) {
	this.game   = game;
	this.canvas = game.canvas;
	this.ctx    = game.ctx;

	var buildingImg = game.resources && game.resources.BUILDING;
	this.width    = Math.round(Math.random() * ((buildingImg ? buildingImg.width : 300) - 200)) + 200;
	this.height   = Math.round(Math.random() * 50) + 100;
	this.fullWidth= this.width + 15;
	this.x        = x || 0;
	this.y        = this.canvas.height - this.height;

	if (typeof this.game.roofCount !== 'number') this.game.roofCount = 0;
	this.game.roofCount++;
	this.index = this.game.roofCount;

	this.shouldSpawnEnemy = Math.round(Math.random() * 100) >= 30;
	this.enemy       = null;
	this.keyPlaced   = false;
	this.doorPlaced  = false;
	this.itemPlaced  = false; // legacy, keep for safety
}

Roof.prototype.update = function() {
	var renderX = this.x - this.game.cameraX;
	var roof    = this.game.resources.BUILDING;
	if (!roof) return;

	this.ctx.drawImage(roof, 0, 0, this.width, this.height, renderX, this.y, this.width, this.height);
	this.ctx.drawImage(roof, this.width, 0, 15, 26, renderX + this.width, this.y, 15, 26);

	// Place level items when this roof's index matches the plan
	try {
		var plan = this.game.levelPlan;
		if (plan) {

			// ── Key ──
			if (!this.keyPlaced && this.index === plan.keyRoofIndex) {
				var keyImg   = this.game.resources.KEY || { width: 754, height: 350 };
				var keyScale = 0.04; // ~30x14px on screen
				var kw       = keyImg.width  * keyScale;
				var kh       = keyImg.height * keyScale;
				var key = new Key(this.game, {
					x    : this.x + Math.floor(this.width / 2) - Math.floor(kw / 2),
					y    : this.y - kh - 8,
					scale: keyScale,
				});
				this.game.addItem(key);
				try {
					if (this.game.levelManager && this.game.levelManager.active)
						this.game.levelManager.keyX = key.x;
				} catch(e) {}
				this.keyPlaced = true;
			}

			// ── Door ──
			if (!this.doorPlaced && this.index === plan.doorRoofIndex) {
				try {
					// Create door fresh right here on this roof — no hidden pre-placement
					var doorScale = 0.5;
					var doorImg   = this.game.resources.DOOR_CLOSED || { width: 32, height: 48 };
					var doorW     = doorImg.width * doorScale;
					// Place 20px inward from right edge so player stands on roof in front of it
					var doorX = Math.round(this.x + this.width - doorW - 20);
					var door  = new Door(this.game, {
						x     : doorX,
						y     : this.y,
						scale : doorScale,
						hidden: false,  // visible immediately
					});
					this.game.addItem(door);
					this.game._levelDoor = door;
					if (this.game.levelManager) {
						this.game.levelManager.levelEndX = this.x + this.width;
					}
				} catch(e) {}
				this.doorPlaced = true;
			}
		}
	} catch(e) {}

	// Lazy-spawn enemy when roof comes into view
	if (this.shouldSpawnEnemy && !this.enemy) {
		var margin = 100;
		if (renderX <= this.game.canvas.width + margin) {
			var spawner = new IntroSpawner(this.game, { targetX: this.x + this.width / 2, roof: this });
			spawner.y   = this.y - 1;
			this.game.addEnemy(spawner);
			this.enemy = spawner;
		}
	}

	if (renderX + this.width <= 0) {
		this.game.removeRoof(this);
		this.game.removeEnemy(this.enemy);
	}
};

// ─────────────────────────────────────────────
//  PLATFORM  (fixed floating platform for Level 2+)
// ─────────────────────────────────────────────

function Platform(game, opts) {
	opts        = opts || {};
	this.game   = game;
	this.canvas = game.canvas;
	this.ctx    = game.ctx;
	this.x      = opts.x      || 0;
	this.y      = opts.y      || 200;
	this.width  = opts.width  || 120;
	this.height = opts.height || 18;
	this.color  = opts.color  || '#5a3e1b';
	this.accent = opts.accent || '#8b6230';
	// fullWidth alias used by isRoofAtPoint
	this.fullWidth = this.width;
	// treat like a roof for collision queries
	this._isPlatform = true;
}

Platform.prototype.update = function() {
	var rx  = this.x - this.game.cameraX;

	// cull
	if (rx + this.width < -50 || rx > this.canvas.width + 50) return;

	var ctx      = this.ctx;
	var buildImg = this.game.resources.BUILDING;

	if (buildImg) {
		// Draw exactly like Level 1 roofs — same building.png asset
		ctx.drawImage(buildImg, 0, 0, this.width, this.height, rx, this.y, this.width, this.height);
		// right cap strip (same 15px cap as Level 1)
		ctx.drawImage(buildImg, this.width, 0, 15, 26, rx + this.width, this.y, 15, 26);
	} else {
		// fallback solid rect if image not loaded
		ctx.fillStyle = '#4a3020';
		ctx.fillRect(rx, this.y, this.width, this.height);
	}
};

// ─────────────────────────────────────────────
//  CEILING BAR  (overhead grab bar — player hangs and walks along it)
// ─────────────────────────────────────────────

function GrabPoint(game, opts) {
	opts      = opts || {};
	this.game = game;
	this.x    = opts.x     || 0;    // world X left edge of bar
	this.y    = opts.y     || 60;   // world Y of the bar (player hands grip here)
	this.width= opts.width || 200;  // horizontal length of bar
	// ropeH kept for compat but unused
	this.ropeH = 0;
}

GrabPoint.prototype.update = function() {
	var rx  = this.x - this.game.cameraX;
	var ctx = this.game.ctx;

	// cull
	if (rx + this.width < -20 || rx > this.game.canvas.width + 20) return;

	ctx.save();

	// bar shadow
	ctx.fillStyle = 'rgba(0,0,0,0.3)';
	ctx.fillRect(rx + 3, this.y + 3, this.width, 10);

	// main bar — steel look
	var grad = ctx.createLinearGradient(rx, this.y, rx, this.y + 10);
	grad.addColorStop(0,   '#d0d0d0');
	grad.addColorStop(0.4, '#888');
	grad.addColorStop(1,   '#555');
	ctx.fillStyle = grad;
	ctx.fillRect(rx, this.y, this.width, 10);

	// rivets
	ctx.fillStyle = '#bbb';
	for (var bx = rx + 16; bx < rx + this.width - 10; bx += 40) {
		ctx.beginPath();
		ctx.arc(bx, this.y + 5, 3.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#999';
		ctx.beginPath();
		ctx.arc(bx, this.y + 5, 1.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#bbb';
	}

	// glow hint so player notices it
	ctx.strokeStyle = 'rgba(100,200,255,0.35)';
	ctx.lineWidth   = 2;
	ctx.strokeRect(rx, this.y, this.width, 10);

	ctx.restore();
};

// ─────────────────────────────────────────────
//  ENEMY
// ─────────────────────────────────────────────

function Enemy(game, opts) {
	opts = opts || {};
	this.game   = game;
	this.canvas = game.canvas;
	this.ctx    = game.ctx;

	this.health    = opts.health    || 4;
	this.maxHealth = opts.maxHealth || this.health;
	this.name      = opts.name      || "THUG";
	this.x         = opts.x         || this.canvas.width - 50;
	this.y         = opts.y         || 0;
	this.scale     = 0.5;
	this.stateImg  = this.game.resources[this.name];

	// DOM GIF overlay for animated GIFs
	this.domImg = null;
	try {
		var resPath = RESOURCES[this.name];
		if (resPath && typeof resPath === 'string' && resPath.toLowerCase().indexOf('.gif') !== -1) {
			this.domImg = document.createElement('img');
			this.domImg.src = RESOURCES_FOLDER_PATH + resPath;
			Object.assign(this.domImg.style, {
				position:'absolute', pointerEvents:'none', zIndex:'9999',
				transformOrigin:'center', display:'none', left:'-9999px', top:'-9999px',
			});
			document.body.appendChild(this.domImg);
		}
	} catch(e) {}

	// sprite sheet frames
	this.frames = [];
	for (var i = 1; i <= 5; i++) {
		var fk = this.name + "_" + i;
		if (this.game.resources[fk]) this.frames.push(this.game.resources[fk]);
	}
	this.frameRate  = opts.frameRate  || 3;
	this.roof       = opts.roof       || null;
	this.patrolMin  = this.roof ? this.roof.x + 10 : 0;
	this.patrolMax  = this.roof ? (this.roof.x + this.roof.width - 10) : this.canvas.width;
	this.patrolSpeed= opts.patrolSpeed|| 0.8;
	this.direction  = Math.random() > 0.5 ? 1 : -1;
	this.wasDamagedOnPreviousFrame = false;
	this.frame      = 0;
	this.lastShotFrame  = 0;
	this.shootCooldown  = opts.shootCooldown || 120;
}

Enemy.prototype.shoot = function() {
	var self  = this;
	var knife = this.game.resources.KNIFE;
	if (!knife) return;
	var p     = new Projectile(this.game);
	p.name    = 'KNIFE';
	p.damage  = 1;
	var kw = knife.width  * this.scale / 2;
	var kh = knife.height * this.scale / 2;
	var dir = this.direction; // -1 left, 1 right — always faces player when attacking
	p.x = this.x + (dir > 0 ? (this.stateImg.width * this.scale) : -kw);
	p.y = this.y + (this.stateImg.height * this.scale / 2) - kh / 2;
	p.update = function() {
		this.ctx.save();
		if (dir < 0) {
			this.ctx.scale(-1, 1);
			this.ctx.drawImage(knife, -(this.x - this.game.cameraX + kw), this.y, kw, kh);
		} else {
			this.ctx.drawImage(knife, this.x - this.game.cameraX, this.y, kw, kh);
		}
		this.ctx.restore();
		this.x += dir * 6;
	};
	this.game.addProjectile(p);
};

Enemy.prototype.drawHealthbar = function() {
	var hb = { height:5, width:100, style:"red", borderWidth:2, borderStyle:"black" };
	var x  = this.x - this.game.cameraX - hb.width / 2 + this.stateImg.width * this.scale / 2;
	var y  = this.y - (hb.height + hb.borderWidth * 2) - 5;
	var w  = hb.width * this.health / this.maxHealth;
	this.ctx.fillStyle = hb.borderStyle;
	this.ctx.fillRect(x - hb.borderWidth, y - hb.borderWidth, hb.width + hb.borderWidth*2, hb.height + hb.borderWidth*2);
	this.ctx.fillStyle = hb.style;
	this.ctx.fillRect(x, y, w, hb.height);
};

Enemy.prototype.update = function() {
	var img;
	if (this.frames && this.frames.length) {
		img = this.frames[Math.floor(this.frame / this.frameRate) % this.frames.length];
	} else {
		img = this.game.resources[this.name];
	}
	this.stateImg = img;

	if (this.health <= 0) { this.remove(); return; }

	this.drawHealthbar();

	if (this.roof) {
		var sp = this.game.spiderman;
		if (sp && this.canSeePlayer()) {
			// Chase mode: face player and walk toward them
			var dx = sp.x - this.x;
			this.direction = dx > 0 ? 1 : -1;
			var dist = Math.abs(dx);
			if (dist > 60) {
				// Walk toward player, stay on roof
				var nextX = this.x + this.direction * this.patrolSpeed * 2;
				if (nextX >= this.patrolMin && nextX <= this.patrolMax) {
					this.x = nextX;
				}
			}
			// else: within attack range — stand still and shoot (handled below)
		} else {
			// Patrol normally when player not in sight
			if (this.x < this.patrolMin) { this.x = this.patrolMin; this.direction = 1; }
			else if (this.x > this.patrolMax) { this.x = this.patrolMax; this.direction = -1; }
			this.x += this.direction * this.patrolSpeed;
		}
	}

	var renderX = this.x - this.game.cameraX;
	var width   = img.width  * this.scale;
	var height  = img.height * this.scale;

	if (this.domImg) {
		try {
			var cr   = this.game.canvas.getBoundingClientRect();
			var left = Math.round(cr.left + renderX);
			var top  = Math.round(cr.top  + this.y);
			var onCanvas = renderX + width >= 0 && renderX <= this.game.canvas.width;
			if (!onCanvas) {
				this.domImg.style.display = 'none';
			} else {
				Object.assign(this.domImg.style, {
					display:'block', left:left+'px', top:top+'px',
					width:Math.round(width)+'px', height:Math.round(height)+'px',
					transform: this.direction === DIRECTION.LEFT ? 'scaleX(-1)' : 'scaleX(1)',
				});
			}
		} catch(e) {}
	} else {
		if (this.direction === DIRECTION.LEFT) {
			this.ctx.save();
			this.ctx.scale(-1, 1);
			this.ctx.drawImage(img, (renderX + width) * -1, this.y, width, height);
			this.ctx.restore();
		} else {
			this.ctx.drawImage(img, renderX, this.y, width, height);
		}
	}

	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		this.ctx.fillStyle = "rgba(255,0,0,0.2)";
		this.ctx.fillRect(renderX, this.y, width, height);
	}

	var inScreen = renderX <= this.canvas.width && renderX + width >= 0;
	if (inScreen && this.canSeePlayer()) {
		if (this.frame - this.lastShotFrame >= this.shootCooldown) {
			this.shoot();
			this.lastShotFrame = this.frame;
		}
	}

	this.frame++;
};

Enemy.prototype.canSeePlayer = function() {
	var sp = this.game.spiderman;
	if (!sp) return false;
	var withinRange = Math.abs(this.x - sp.x) <= 350;
	var sameRoof    = this.roof
		? sp.x >= this.roof.x && sp.x <= (this.roof.x + this.roof.width)
		: Math.abs(sp.y - this.y) < 40;
	return withinRange && sameRoof;
};

Enemy.prototype.remove = function() {
	this.game.score++;
	this.game.spiderman.web += this.maxHealth;
	if (this.domImg && this.domImg.parentNode) { this.domImg.parentNode.removeChild(this.domImg); this.domImg = null; }
	this.game.removeEnemy(this);
};

Enemy.prototype.handleHitWithProjectile = function(p) {
	if (p.name === "WEB") { this.health -= p.damage; this.wasDamagedOnPreviousFrame = true; }
};

// ─────────────────────────────────────────────
//  INTRO SPAWNER  (enemy walk-in animation)
// ─────────────────────────────────────────────

function IntroSpawner(game, opts) {
	opts = opts || {};
	this.game    = game;
	this.roof    = opts.roof    || null;
	this.targetX = opts.targetX || (this.roof ? this.roof.x + this.roof.width / 2 : 100);
	this.x       = this.roof ? this.roof.x - 200 : -200;
	this.y       = opts.y      || 0;
	this.speed   = opts.speed  || 1.5;
	this.scale   = opts.scale  || 0.5;
	this.frame   = 0;
	this.domImg  = null;

	try {
		if (RESOURCES["IN"]) {
			this.domImg = document.createElement('img');
			this.domImg.src = RESOURCES_FOLDER_PATH + RESOURCES["IN"];
			Object.assign(this.domImg.style, {
				position:'absolute', pointerEvents:'none', zIndex:'9999',
				transformOrigin:'center', display:'none', left:'-9999px', top:'-9999px',
			});
			document.body.appendChild(this.domImg);
		}
	} catch(e) {}
}

IntroSpawner.prototype.update = function() {
	if (this.x < this.targetX) this.x = Math.min(this.x + this.speed, this.targetX);

	var renderX = this.x - this.game.cameraX;
	var imgBase = this.game.resources["THUG"] || {};
	var width   = (imgBase.width  || 64) * this.scale;
	var height  = (imgBase.height || 64) * this.scale;

	if (this.domImg) {
		try {
			var cr   = this.game.canvas.getBoundingClientRect();
			var left = Math.round(cr.left + renderX);
			var top  = Math.round(cr.top  + this.y - height);
			var on   = renderX + width >= 0 && renderX <= this.game.canvas.width;
			if (!on) {
				this.domImg.style.display = 'none';
			} else {
				Object.assign(this.domImg.style, {
					display:'block', left:left+'px', top:top+'px',
					width:Math.round(width)+'px', height:Math.round(height)+'px',
				});
			}
		} catch(e) {}
	}

	if (this.x >= this.targetX) {
		var enemy = new Enemy(this.game, { x: this.targetX, roof: this.roof });
		enemy.y = this.roof.y - 1 - enemy.stateImg.height * enemy.scale;
		if (this.roof) this.roof.enemy = enemy;
		this.game.addEnemy(enemy);
		this.game.removeEnemy(this);
	}

	this.frame++;
};

// ─────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────

window.LoveGame   = LoveGame;
window.Projectile = Projectile;
window.SpiderMan  = SpiderMan;
window.Enemy      = Enemy;
window.Roof       = Roof;
window.Platform   = Platform;

})(window, document);
