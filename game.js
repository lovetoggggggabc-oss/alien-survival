(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const mapCanvas=$('minimap'),mapCtx=mapCanvas.getContext('2d');
  const WORLD_W = 12280, ORIGIN = 145, SURFACE = 340, TILE = 20, COLS = WORLD_W / TILE, ROWS = 60;
  const SPAWN_X=880;
  const WORLD_H = ORIGIN + ROWS * TILE;
  const DAY = 540, NIGHT = 240, CYCLE = DAY + NIGHT;
  const names = { stone:'돌', dirt:'흙', wood:'나무', metal:'금속', copper:'구리광석', iron:'철광석', fiber:'섬유', crystal:'발광 수정', food:'식량', medkit:'회복약', ladder:'사다리',chest:'보관 상자' };
  const buildings = {
    drafting:{ name:'설계도 작업대', icon:'⌑', cost:{stone:3,metal:1,fiber:2}, w:88,h:75,work:7 },
    workshop:{ name:'제작소', icon:'⚙', cost:{stone:4,metal:2,fiber:2}, w:92,h:82,work:8 },
    toolbench:{ name:'도구 제작대', icon:'⚒', cost:{stone:4,wood:3,copper:2,iron:1}, w:86,h:68,work:8 },
    bed:{ name:'침대', icon:'▤', cost:{stone:3,metal:2,fiber:2}, w:70,h:43,work:6 },
    farm:{ name:'재배실', icon:'✿', cost:{stone:2,fiber:5}, w:100,h:48,work:7 },
    wall:{ name:'방벽', icon:'▣', cost:{stone:6,metal:3}, w:32,h:90,work:8 }
  };
  const crafts = {
    pickaxe:{name:'강화 곡괭이',description:'땅과 광물을 더 빠르게 캡니다',cost:{stone:4,metal:3,crystal:1}},
    copperPickaxe:{name:'구리 곡괭이',description:'채굴력 2 · 구리로 만든 도구',cost:{copper:4,wood:2,stone:2}},
    ironPickaxe:{name:'철 곡괭이',description:'채굴력 3 · 단단한 광석도 빠르게 채굴',cost:{iron:4,copper:2,wood:2}},
    sword:{name:'강화 무기',description:'공격 피해가 증가합니다',cost:{metal:4,fiber:2,crystal:1}},
    spear:{name:'수정 창',description:'조금 더 먼 거리에서 공격합니다',cost:{stone:3,wood:2,crystal:3}},
    armor:{name:'금속 방어복',description:'몬스터에게 받는 피해를 줄입니다',cost:{metal:5,fiber:3}},
    helmet:{name:'금속 헬멧',description:'머리를 보호해 받는 피해를 1 줄입니다',cost:{metal:3,fiber:1}},
    leggings:{name:'금속 바지',description:'다리를 보호해 받는 피해를 1 줄입니다',cost:{metal:4,fiber:2}},
    boots:{name:'탐사 신발',description:'피해를 1 줄이고 이동 속도를 높입니다',cost:{metal:2,fiber:3}},
    lamp:{name:'탐사 등불',description:'지하를 더 넓게 비춥니다',cost:{metal:2,crystal:1}},
    ladder:{name:'사다리 ×4',description:'빈 공간을 터치해 설치하고 올라갑니다',cost:{stone:1,fiber:2}},
    medkit:{name:'회복약',description:'가방에서 사용하면 체력 35 회복',cost:{fiber:3,food:2}},
    chest:{name:'보관 상자',description:'지상에 놓아 재료와 소비품을 보관합니다',cost:{wood:5,stone:2}}
  };
  const gear = {
    basicSword:{name:'기본 무기',slot:'weapon',detail:'공격력 18'},
    sword:{name:'강화 무기',slot:'weapon',detail:'공격력 30'},
    spear:{name:'수정 창',slot:'weapon',detail:'공격력 25 · 긴 사거리'},
    basicPickaxe:{name:'기본 곡괭이',slot:'tool',detail:'채굴력 1'},
    pickaxe:{name:'강화 곡괭이',slot:'tool',detail:'채굴력 2'},
    copperPickaxe:{name:'구리 곡괭이',slot:'tool',detail:'채굴력 2'},
    ironPickaxe:{name:'철 곡괭이',slot:'tool',detail:'채굴력 3'},
    armor:{name:'금속 방어복',slot:'armor',detail:'받는 피해 감소'},
    helmet:{name:'금속 헬멧',slot:'helmet',detail:'받는 피해 -1'},
    leggings:{name:'금속 바지',slot:'legs',detail:'받는 피해 -1'},
    boots:{name:'탐사 신발',slot:'boots',detail:'받는 피해 -1 · 이동 속도 +12%'},
    lamp:{name:'탐사 등불',slot:'light',detail:'지하 시야 증가'}
  };
  const plans = {
    workshop:{cost:{wood:1,fiber:1}},toolbench:{cost:{wood:2,copper:1}},bed:{cost:{wood:2,fiber:1}},
    farm:{cost:{wood:2,stone:1}}, wall:{cost:{stone:2,dirt:2}}
  };
  const blockTypes={dirt:1,stone:2,wood:5};
  const achievements={
    firstDig:{icon:'⛏',name:'첫 삽질',description:'블록을 처음 채굴하기',goal:1,stat:'blocksMined'},
    miner:{icon:'▧',name:'지하 개척자',description:'블록 30개 채굴하기',goal:30,stat:'blocksMined'},
    deep:{icon:'✦',name:'깊은 곳의 탐험가',description:'지하 깊이 15칸에 도달하기',goal:15,stat:'maxDepth'},
    lumber:{icon:'♣',name:'숲지기',description:'나무 10개 채집하기',goal:10,stat:'woodCollected'},
    builder:{icon:'⌑',name:'첫 건설',description:'건물을 처음 완공하기',goal:1,stat:'buildingsBuilt'},
    explorer:{icon:'⌖',name:'원정대',description:'시작점에서 200칸 떨어진 곳에 도착하기',goal:200,stat:'maxDistance'},
    survivor:{icon:'☀',name:'생존자',description:'3일차에 도달하기',goal:3,stat:'day'},
    hunter:{icon:'⚔',name:'밤의 수호자',description:'적 5마리 처치하기',goal:5,stat:'kills'}
  };
  const initial = () => ({version:8,time:0,day:1,hp:100,hunger:100,temperature:36.5,tempClock:0,lastBiome:'meadow',food:4,
    inv:{stone:5,dirt:4,wood:2,metal:2,copper:0,iron:0,fiber:3,crystal:0,ladder:0,medkit:0,chest:0},
    upgrades:{pickaxe:false,sword:false,lamp:false},
    ownedGear:{basicSword:true,basicPickaxe:true},equipped:{weapon:'basicSword',tool:'basicPickaxe',helmet:null,armor:null,legs:null,boots:null,light:null},
    player:{x:880,y:SURFACE-28,vy:0,facing:1},sites:[],allies:[],enemies:[],resources:[],
    terrain:null,ladders:[],placedBlocks:{},enemyDamage:{},chests:[],blueprints:{},settings:{joystickSize:108},kills:0,
    stats:{blocksMined:0,maxDepth:0,woodCollected:0,buildingsBuilt:0,maxDistance:0},awards:{},selectedItem:'stone'});
  let s;
  try { s = JSON.parse(localStorage.getItem('alien-survival-save')) || initial(); } catch { s = initial(); }
  if (!s.version || s.version<2) {
    const old = s, fresh = initial();
    fresh.time = old.time || 0; fresh.day = old.day || 1; fresh.hp = old.hp || 100;
    fresh.food = old.food ?? 4; fresh.inv = {...fresh.inv,...old.inv};
    fresh.player.x = old.player?.x ?? 880;
    fresh.sites = (old.sites || []).filter(a => buildings[a.kind]);
    fresh.allies = old.allies || []; fresh.kills = old.kills || 0;
    s = fresh;
  }
  s.inv = {...initial().inv,...s.inv};
  s.hunger=Number.isFinite(s.hunger)?Math.max(0,Math.min(100,s.hunger)):100;
  s.temperature=Number.isFinite(s.temperature)?s.temperature:36.5;s.tempClock=Number(s.tempClock)||0;
  s.kills=Number(s.kills)||0;
  s.upgrades = {...initial().upgrades,...s.upgrades};
  s.player = {...initial().player,...s.player};
  s.lastBiome||=biomeAt(s.player.x);
  s.sites ||= []; s.allies ||= []; s.resources ||= []; s.enemies ||= []; s.ladders ||= [];s.chests||=[];
  for(const ally of s.allies)ally.hp=Math.max(0,Math.min(40,Number(ally.hp) || 40));
  s.placedBlocks ||= {};s.enemyDamage||={};s.blueprints ||= {};s.settings={...initial().settings,...s.settings};
  s.stats={...initial().stats,...s.stats};s.awards||={};s.selectedItem||='stone';
  s.ownedGear={...initial().ownedGear,...s.ownedGear};s.equipped={...initial().equipped,...s.equipped};
  for(const key of ['pickaxe','sword','lamp'])if(s.upgrades[key]){
    s.ownedGear[key]=true;
    if(!s.equipped[gear[key].slot]||s.equipped[gear[key].slot]===initial().equipped[gear[key].slot])s.equipped[gear[key].slot]=key;
  }
  const hash = (x,y) => { let n = Math.imul(x+173,374761393)^Math.imul(y+71,668265263); n=Math.imul(n^(n>>>13),1274126177); return ((n^(n>>>16))>>>0)/4294967295; };
  function legacySurfaceRow(c){
    const x=c*24;
    if(x>=720&&x<=1200)return 8;
    const mountains=5*Math.exp(-Math.pow((x-1930)/290,2))+7*Math.exp(-Math.pow((x-4520)/350,2));
    const hills=2.3*Math.sin(c/17)+1.3*Math.sin(c/7)+1.1*Math.sin(c/39);
    const valley=2*Math.exp(-Math.pow((x-3250)/250,2));
    return Math.max(2,Math.min(12,Math.round(8-hills-mountains+valley)));
  }
  function surfaceRow(c){return Math.round(legacySurfaceRow(Math.floor((c+.5)*TILE/24))*24/TILE);}
  const surfaceRows=Array.from({length:COLS},(_,c)=>surfaceRow(c));
  function groundY(x){const c=Math.max(0,Math.min(COLS-1,Math.floor(x/TILE)));return ORIGIN+surfaceRows[c]*TILE;}
  function biomeAt(x){return x>=3000&&x<5300?'desert':x>=7500&&x<10500?'tundra':'meadow';}
  const biomeNames={meadow:'초원',desert:'사막',tundra:'툰드라'};
  const SPAWN_Y=groundY(SPAWN_X);
  function legacyTerrainTile(c,r,oldCaves=false){const top=legacySurfaceRow(c);if(r<top)return 0;if(r===top)return 1;
    if(r>top+3){
      const offset=oldCaves?0:5;
      const chambers=[[35,20,12,4],[91,28,15,6],[143,17,11,4],[205,31,17,6],[238,20,10,4]].map(([cx,cy,rx,ry])=>[cx,cy+offset,rx,ry]);
      if(chambers.some(([cx,cy,rx,ry])=>((c-cx)/rx)**2+((r-cy)/ry)**2<1))return 0;
      const tunnelA=top+9+offset+Math.round(2.3*Math.sin(c/13));
      const tunnelB=top+22+offset+Math.round(2*Math.sin(c/19));
      if(Math.abs(r-tunnelA)<=1||Math.abs(r-tunnelB)<=1)return 0;
      if(hash(Math.floor(c/3),Math.floor(r/3))*.6+hash(c,r)*.4>.76)return 0;
    }
    const ore=hash(c+141,r+19);
    if(r>top+5&&ore>.975)return 4;
    if(r>top+3&&ore>.91)return 3;
    return r<top+3?1:2;
  }
  function oreType(c,r){const v=hash(c+227,r+619);return v>.69?6:v>.38?7:3;}
  function makeTerrain(){return Array.from({length:ROWS},(_,r)=>Array.from({length:COLS},(_,c)=>{
    if(r<surfaceRows[c])return 0;
    const oldC=Math.floor((c+.5)*TILE/24),oldR=Math.floor((r+.5)*TILE/24);
    const type=r===surfaceRows[c]?1:legacyTerrainTile(oldC,oldR);
    return type===3?oreType(c,r):type;
  }));}
  const oldTerrain=s.terrain;
  if(!s.terrain||s.terrain.length!==ROWS||s.terrain[0]?.length!==COLS){
    s.terrain=makeTerrain();
    if(oldTerrain?.length===48&&oldTerrain[0]?.length===256){
      for(let r=0;r<48;r++)for(let c=0;c<256;c++){
        const type=oldTerrain[r][c];if(type===legacyTerrainTile(c,r,s.version<5))continue;
        const left=Math.floor(c*24/TILE),right=Math.min(COLS-1,Math.ceil((c+1)*24/TILE)-1);
        const top=Math.floor(r*24/TILE),bottom=Math.min(ROWS-1,Math.ceil((r+1)*24/TILE)-1);
        for(let nr=top;nr<=bottom;nr++)for(let nc=left;nc<=right;nc++)if(nr>=surfaceRows[nc]||type!==0)s.terrain[nr][nc]=type;
      }
    }
    if(oldTerrain?.length===26){
      for(let r=0;r<26;r++)for(let c=0;c<72;c++)if(oldTerrain[r]?.[c]===0){
        const cx=(c+.5)*32,cy=340+(r+.5)*32;
        const nc=Math.floor(cx/TILE),nr=Math.floor((cy-ORIGIN)/TILE);
        if(nr>=surfaceRows[nc]&&nr<ROWS)s.terrain[nr][nc]=0;
      }
    }
    const oldPlaced=s.placedBlocks;s.placedBlocks={};
    const oldSize=oldTerrain?.length===26?32:24,oldOrigin=oldSize===32?340:ORIGIN;
    for(const [key,type] of Object.entries(oldPlaced)){
      const [c,r]=key.split(',').map(Number),left=Math.floor(c*oldSize/TILE),right=Math.ceil((c+1)*oldSize/TILE)-1;
      const top=Math.floor((oldOrigin+r*oldSize-ORIGIN)/TILE),bottom=Math.ceil((oldOrigin+(r+1)*oldSize-ORIGIN)/TILE)-1;
      for(let nr=top;nr<=bottom;nr++)for(let nc=left;nc<=right;nc++)if(nc>=0&&nc<COLS&&nr>=0&&nr<ROWS){s.terrain[nr][nc]=0;s.placedBlocks[`${nc},${nr}`]=type;}
    }
    s.ladders=s.ladders.map(a=>({c:Math.floor((a.c+.5)*oldSize/TILE),r:Math.floor((oldOrigin+(a.r+.5)*oldSize-ORIGIN)/TILE)}));
    for(const ladder of s.ladders)if(ladder.c>=0&&ladder.c<COLS&&ladder.r>=0&&ladder.r<ROWS)s.terrain[ladder.r][ladder.c]=0;
    if(s.player.y+28>groundY(s.player.x)){const pc=Math.floor(s.player.x/TILE),pr=Math.floor((s.player.y-ORIGIN)/TILE);
      for(let nr=pr;nr<=pr+2;nr++)for(let nc=pc-1;nc<=pc+1;nc++)if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS)s.terrain[nr][nc]=0;
    }else s.player.y=groundY(s.player.x)-24;
    s.player.vy=0;s.damage={};
  }
  if(s.version<8)for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(s.terrain[r][c]===3)s.terrain[r][c]=oreType(c,r);
  s.version=8;
  const random=(a,b)=>a+Math.random()*(b-a);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function addResource() {
    const types=['stone','wood','wood','fiber','fiber','food','food','metal'];
    s.resources.push({x:random(56,WORLD_W-56),type:types[Math.floor(random(0,types.length))],hp:2});
  }
  while (s.resources.length < 150) addResource();
  if (!s.resources.some(a=>a.type==='wood'&&Math.abs(a.x-s.player.x)<170))
    s.resources.push({x:clamp(s.player.x+74,56,WORLD_W-56),type:'wood',hp:3});

  let logicalW=420,logicalH=780,scale=1,viewX=0,viewY=0;
  let speed=1,mode=null,targetTile=null,previewX=null;
  let last=performance.now(),mineCooldown=0,attackCooldown=0,spawnCooldown=0,saveClock=0,toastClock=0,hitClock=0,hitTile=null,blockImpact=null;
  let hurtClock=0,deathClock=0,painTimer=0;
  const damageFloats=[];
  let joystick={x:0,y:0,pointer:null},held={mine:false,attack:false};
  function resize() {
    const d=Math.min(devicePixelRatio||1,2),portrait=innerHeight>innerWidth;
    canvas.width=Math.round(innerWidth*d);canvas.height=Math.round(innerHeight*d);
    logicalH=portrait?780:Math.round(960*innerHeight/innerWidth);
    logicalW=portrait?Math.round(780*innerWidth/innerHeight):960;
    scale=canvas.width/logicalW; ctx.imageSmoothingEnabled=false;
  }
  addEventListener('resize',resize);resize();
  document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
  document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
  function flash(message) { $('toast').textContent=message;$('toast').classList.add('show');toastClock=3; }
  function takeDamage(amount,major=false){if(s.hp<=0)return;s.hp=Math.max(0,s.hp-amount);
    if(major||painTimer<=0){hurtClock=.42;painTimer=1.5;}
  }
  function checkAwards(){for(const [id,a] of Object.entries(achievements)){
    const progress=a.stat==='day'?s.day:a.stat==='kills'?s.kills:s.stats[a.stat];
    if(!s.awards[id]&&progress>=a.goal){s.awards[id]=s.day;flash(`🏆 상장 획득: ${a.name}`);}
  }}
  function save(silent=false) { localStorage.setItem('alien-survival-save',JSON.stringify(s));if(!silent) flash('게임을 저장했어요'); }
  const phase=()=>s.time%CYCLE<DAY?'낮':'밤';
  const nearSurface=()=>s.player.y<groundY(s.player.x)+45;
  const nearSite=(site,radius=115)=>nearSurface()&&Math.abs(s.player.x-site.x)<radius;
  const costText=cost=>Object.entries(cost).map(([k,n])=>`${names[k]} ${n}`).join(' · ');
  const canPay=cost=>Object.entries(cost).every(([k,n])=>(k==='food'?s.food:s.inv[k]||0)>=n);
  function pay(cost){for(const [k,n] of Object.entries(cost)){if(k==='food')s.food-=n;else s.inv[k]-=n;}}
  const workshopReady=()=>s.sites.some(a=>a.kind==='workshop'&&a.done&&nearSite(a,135));
  const toolbenchReady=()=>s.sites.some(a=>a.kind==='toolbench'&&a.done&&nearSite(a,135));
  const draftingReady=()=>s.sites.some(a=>a.kind==='drafting'&&a.done&&nearSite(a,135));
  const toolCrafts=new Set(['pickaxe','copperPickaxe','ironPickaxe','sword','spear','armor','helmet','leggings','boots']);

  function tileAt(c,r){
    if(c<0||c>=COLS||r>=ROWS)return 2;
    if(r<0)return 0;
    return s.placedBlocks[`${c},${r}`]||s.terrain[r][c];
  }
  function solidPoint(x,y){if(y<ORIGIN)return false;return tileAt(Math.floor(x/TILE),Math.floor((y-ORIGIN)/TILE))!==0;}
  function blocked(x,y){return solidPoint(x-7,y+2)||solidPoint(x+7,y+2)||solidPoint(x-7,y+23)||solidPoint(x+7,y+23);}
  function moveAxis(amount,axis){const p=s.player,n=Math.ceil(Math.abs(amount)/4),unit=amount/n;if(!n)return false;for(let i=0;i<n;i++){
    const nx=axis==='x'?p.x+unit:p.x,ny=axis==='y'?p.y+unit:p.y;
    if(blocked(nx,ny))return true;
    p.x=clamp(nx,9,WORLD_W-9);p.y=clamp(ny,-80,WORLD_H-25);
  }return false;}
  function grounded(){return blocked(s.player.x,s.player.y+2);}
  function jump(){if(grounded()){s.player.vy=-315;flash('점프!');}}
  function inReach(c,r){const x=c*TILE+TILE/2,y=ORIGIN+r*TILE+TILE/2;
    return Math.hypot(x-s.player.x,y-(s.player.y+12))<76;}
  function selectDigTile(){
    if(targetTile&&Math.abs(joystick.x)<.25&&Math.abs(joystick.y)<.25&&inReach(targetTile.c,targetTile.r)&&tileAt(targetTile.c,targetTile.r))return targetTile;
    const p=s.player,down=joystick.y>.37,up=joystick.y<-.55;
    const choices=down?[[p.x,p.y+33],[p.x+p.facing*23,p.y+35]]:
      up?[[p.x,p.y-13],[p.x+p.facing*23,p.y+2]]:
      [[p.x+p.facing*23,p.y+12],[p.x+p.facing*23,p.y+25],[p.x,p.y+33]];
    for(const [x,y] of choices){let c=Math.floor(x/TILE),r=Math.floor((y-ORIGIN)/TILE);
      if(tileAt(c,r)&&inReach(c,r))return {c,r};}
    return null;
  }
  const blockHp=type=>type===1?3:type===5?4:type===2?6:type===3||type===6?8:type===7?10:9;
  function dig(c,r){if(c<0||c>=COLS||r<0||r>=ROWS)return false;const type=tileAt(c,r);if(!type||!inReach(c,r))return false;
    const key=`${c},${r}`;s.damage ||= {};
    const power=s.equipped.tool==='ironPickaxe'?3:['pickaxe','copperPickaxe'].includes(s.equipped.tool)?2:1;
    s.damage[key]=power+(s.damage[key]||0);
    hitTile={c,r};hitClock=.24;const hp=blockHp(type);
    if(s.damage[key]>=hp){
      if(s.placedBlocks[key])delete s.placedBlocks[key];else if(r>=0)s.terrain[r][c]=0;
      delete s.damage[key];delete s.enemyDamage[key];const gain=type===1?'dirt':type===3?'metal':type===4?'crystal':type===5?'wood':type===6?'copper':type===7?'iron':'stone';
      s.inv[gain]++;s.stats.blocksMined++;checkAwards();flash(`${names[gain]} +1`);targetTile=null;
    }
    else flash('광물을 캐는 중…');
    return true;
  }
  function collect(resource){resource.hp--;const k=resource.type;
    if(k==='food')s.food++;else s.inv[k]++;
    if(k==='wood'){s.stats.woodCollected++;checkAwards();}
    flash(`${names[k]} +1`);
    if(resource.hp<=0){s.resources.splice(s.resources.indexOf(resource),1);setTimeout(addResource,3500);}
  }
  function beginBlock(kind){if(!s.inv[kind]){flash(`${names[kind]}이 부족해요`);return;}
    mode=`place:${kind}`;hideModal();flash(`${names[kind]} 설치: 가까운 빈 칸을 터치하세요`);}
  function placeBlock(c,r,kind){
    if(c<0||c>=COLS||r<0||r>=ROWS||!inReach(c,r)){flash('캐릭터 가까운 칸을 선택하세요');return;}
    if(tileAt(c,r)){flash('이미 블록이 있는 칸이에요');return;}
    const p=s.player,x=c*TILE,y=ORIGIN+r*TILE;
    if(x<p.x+8&&x+TILE>p.x-8&&y<p.y+24&&y+TILE>p.y){flash('캐릭터가 있는 곳에는 설치할 수 없어요');return;}
    if(![[c-1,r],[c+1,r],[c,r-1],[c,r+1]].some(([a,b])=>tileAt(a,b))){flash('다른 블록에 붙여 설치하세요');return;}
    if(!s.inv[kind]){mode=null;flash(`${names[kind]}이 부족해요`);return;}
    s.placedBlocks[`${c},${r}`]=blockTypes[kind];delete s.enemyDamage[`${c},${r}`];s.inv[kind]--;
    if(!s.inv[kind])mode=null;
    flash(`${names[kind]} 블록 설치 완료`);
  }
  function supplied(site){return Object.entries(buildings[site.kind].cost).every(([k,n])=>(site.put[k]||0)>=n);}
  function deliver(site,player){let moved=false;
    for(const [k,n] of Object.entries(buildings[site.kind].cost)){
      const qty=Math.min(n-(site.put[k]||0),s.inv[k]||0,player?99:1);
      if(qty>0){s.inv[k]-=qty;site.put[k]=(site.put[k]||0)+qty;moved=true;if(!player)break;}
    }
    if(moved)flash(`${buildings[site.kind].name}에 재료 투입`);
    else if(player)flash('부족한 재료는 가방에서 확인하세요');
  }
  function mine(){
    const p=s.player;
    if(nearSurface()&&joystick.y<.35){
      const site=s.sites.filter(a=>!a.done&&nearSite(a,85)).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
      if(site){
        if(supplied(site)){site.progress+=.6;flash(`${buildings[site.kind].name} 건설 중…`);}
        else deliver(site,true);
        return;
      }
      const resource=s.resources.filter(a=>Math.abs(a.x-p.x)<48).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
      if(resource){collect(resource);return;}
    }
    const tile=selectDigTile();if(tile&&dig(tile.c,tile.r))return;
    flash('땅이나 자원 가까이 이동하세요');
  }
  function damageEnemy(enemy,amount){const dealt=Math.min(enemy.hp,amount);enemy.hp-=amount;enemy.hitFlash=.18;
    damageFloats.push({x:enemy.x+random(-7,7),y:groundY(enemy.x)-36,text:`-${dealt}`,life:.85,color:'#ffdd9b'});
    if(enemy.hp<=0){s.enemies.splice(s.enemies.indexOf(enemy),1);s.kills++;if(Math.random()<.35){s.food++;flash('식량 +1');}}}
  function blockInEnemyPath(enemy,direction){let closest=null,dist=Infinity;
    const center=Math.floor(enemy.x/TILE);
    for(let c=center-2;c<=center+2;c++){
      if(c<0||c>=COLS)continue;
      for(let r=Math.max(0,surfaceRows[c]-3);r<=Math.min(ROWS-1,surfaceRows[c]+1);r++){
        const key=`${c},${r}`;if(!s.placedBlocks[key])continue;
        const x=(c+.5)*TILE,d=Math.abs(x-enemy.x);
        if(d<35&&d<dist&&(direction===0||Math.sign(x-enemy.x)===direction||d<TILE*.7)){
          dist=d;closest={c,r,key};
        }
      }
    }
    return closest;
  }
  function showAwards(){checkAwards();showModal('🏆 상장',`<p class="hint">탐험하고 건설하며 획득한 상장 ${Object.keys(s.awards).length}/${Object.keys(achievements).length}</p>
    <div class="award-list">${Object.entries(achievements).map(([id,a])=>{const value=a.stat==='day'?s.day:a.stat==='kills'?s.kills:s.stats[a.stat];
      return `<div class="award ${s.awards[id]?'earned':''}"><span class="award-icon">${a.icon}</span><div><b>${a.name}</b><small>${a.description}</small></div><strong>${s.awards[id]?'획득':`${Math.min(value,a.goal)}/${a.goal}`}</strong></div>`;}).join('')}</div>`);}
  function attack(){const p=s.player,reach=s.equipped.weapon==='spear'?116:77;
    const enemy=s.enemies.filter(e=>Math.abs(e.x-p.x)<reach&&Math.abs((groundY(e.x)-25)-(p.y+14))<74).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
    if(enemy)damageEnemy(enemy,s.equipped.weapon==='sword'?30:s.equipped.weapon==='spear'?25:18);else flash('공격 범위에 적이 없어요');}
  function build(x,kind){if(!nearSurface()){flash('건물은 지상에 설치할 수 있어요');return;}
    const info=buildings[kind];x=clamp(x,50,WORLD_W-50);
    if(kind!=='drafting'&&!(s.blueprints[kind]>0)){flash('설계도 작업대에서 먼저 설계도를 만드세요');return;}
    if(Math.abs(s.player.x-x)>190){flash('가까운 지면에 설계도를 놓으세요');return;}
    const foundation=surfaceRows[Math.floor(x/TILE)];
    for(let c=Math.floor((x-info.w/2)/TILE);c<=Math.floor((x+info.w/2)/TILE);c++)
      if(c<0||c>=COLS||surfaceRows[c]!==foundation||!tileAt(c,foundation)){
        flash('평탄하고 파이지 않은 지면에 설치하세요');return;
      }
    if(s.sites.some(a=>Math.abs(a.x-x)<(buildings[a.kind].w+info.w)/2+13)){flash('건물 사이의 간격이 부족해요');return;}
    s.sites.push({x,kind,put:{},progress:0,done:false});
    if(kind!=='drafting')s.blueprints[kind]--;
    mode=null;previewX=null;
    flash(`${info.name} 설계도 설치! 채집 버튼으로 재료를 넣으세요`);
  }
  function createPlan(kind){
    if(!draftingReady()){flash('완성된 설계도 작업대 가까이 이동하세요');return;}
    if(!canPay(plans[kind].cost)){flash('설계도 재료가 부족해요');return;}
    pay(plans[kind].cost);s.blueprints[kind]=(s.blueprints[kind]||0)+1;
    flash(`${buildings[kind].name} 설계도 +1`);showDrafting();
  }
  function craft(kind){const recipe=crafts[kind];if(!recipe)return;
    if(toolCrafts.has(kind)?!toolbenchReady():!workshopReady()){flash(`완성된 ${toolCrafts.has(kind)?'도구 제작대':'제작소'} 가까이에서 제작하세요`);return;}
    if(gear[kind]&&s.ownedGear[kind]){flash('이미 제작한 장비예요');return;}
    if(!canPay(recipe.cost)){flash('제작 재료가 부족해요');return;}
    pay(recipe.cost);
    if(gear[kind])s.ownedGear[kind]=true;
    else s.inv[kind]+=kind==='ladder'?4:1;
    flash(`${recipe.name} 제작 완료 · ${gear[kind]?'장비':'가방'}에서 확인하세요`);showCraft();
  }
  function beginChest(){if(!s.inv.chest){flash('상자가 없어요. 제작소에서 만드세요');return;}mode='chest';hideModal();flash('지상의 평평한 땅을 터치해 상자를 놓으세요');}
  function placeChest(x){const center=(Math.floor(x/TILE)+.5)*TILE,y=groundY(center);
    if(!nearSurface()||Math.abs(center-s.player.x)>155||Math.abs(y-(s.player.y+24))>75){flash('캐릭터 가까운 지면을 선택하세요');return;}
    if(Math.abs(groundY(center-18)-y)>1||Math.abs(groundY(center+18)-y)>1||!tileAt(Math.floor(center/TILE),surfaceRows[Math.floor(center/TILE)])||
      s.chests.some(a=>Math.abs(a.x-center)<54)||s.sites.some(a=>Math.abs(a.x-center)<(buildings[a.kind].w/2+25))){flash('상자를 놓을 평평한 빈 자리가 필요해요');return;}
    if(!s.inv.chest)return;
    s.inv.chest--;s.chests.push({x:center,contents:{}});mode=null;flash('상자 설치 완료 · 상자를 터치해 열어보세요');save(true);
  }
  const storageKeys=['stone','dirt','wood','metal','copper','iron','fiber','crystal','food','medkit','ladder'];
  let openChest=null;
  function showChest(chest){if(!s.chests.includes(chest)||Math.abs(s.player.x-chest.x)>110||!nearSurface()){flash('상자 가까이에서 열 수 있어요');return;}
    openChest=chest;chest.contents||={};showModal('▣ 보관 상자',`<p class="hint">각 재료를 최대 64개까지 보관합니다. 상자에 넣은 물건은 저장됩니다.</p>
    <div class="storage-list">${storageKeys.map(key=>{const bag=key==='food'?s.food:s.inv[key],stored=chest.contents[key]||0;
      return `<div class="storage-row"><span>${itemIcons[key]} ${names[key]}<small>가방 ${bag} · 상자 ${stored}/64</small></span><button data-store="${key}" ${!bag||stored>=64?'disabled':''}>넣기</button><button data-store-all="${key}" ${!bag||stored>=64?'disabled':''}>전부</button><button data-take="${key}" ${!stored?'disabled':''}>꺼내기</button></div>`;}).join('')}</div>`);}
  function transferChest(key,direction,all=false){if(!storageKeys.includes(key)||!openChest||!s.chests.includes(openChest)||Math.abs(s.player.x-openChest.x)>110)return;
    const content=openChest.contents,stored=content[key]||0,bag=key==='food'?s.food:s.inv[key];
    const amount=direction==='store'?Math.min(all?bag:1,64-stored):Math.min(all?stored:1,stored);
    if(amount<=0)return;
    content[key]=stored+(direction==='store'?amount:-amount);
    if(key==='food')s.food+=direction==='store'?-amount:amount;else s.inv[key]+=direction==='store'?-amount:amount;
    save(true);showChest(openChest);
  }
  function recruit(){const beds=s.sites.filter(a=>a.kind==='bed'&&a.done).length;
    if(s.allies.length>=beds){flash('완성된 빈 침대가 필요해요');return;}
    if(s.food<2){flash('식량 2개가 필요해요');return;}
    s.food-=2;s.allies.push({x:s.player.x+40,role:'haul',work:0,hp:40});flash('새 동료가 합류했어요');showAllies();
  }
  function useMedkit(){if(!s.inv.medkit||s.hp>=100)return;s.inv.medkit--;s.hp=Math.min(100,s.hp+35);flash('체력 35 회복');showBag();}
  function eatFood(){if(s.food<=0||s.hunger>=100)return;s.food--;s.hunger=Math.min(100,s.hunger+30);flash('식량을 먹어 허기 30 회복');showBag();}
  function respawn(isDeath=false){const p=s.player;
    if(isDeath)s.food=Math.max(0,s.food-2);
    s.hp=100;s.hunger=Math.max(isDeath?60:70,s.hunger);s.temperature=36.5;s.tempClock=0;s.lastBiome='meadow';
    deathClock=isDeath?1.1:.45;hurtClock=0;
    p.x=SPAWN_X;p.y=groundY(SPAWN_X)-24;p.vy=0;p.facing=1;
    s.enemies=s.enemies.filter(e=>Math.abs(e.x-SPAWN_X)>220);
    mode=null;targetTile=null;previewX=null;held.mine=false;held.attack=false;
    viewX=clamp(p.x-logicalW*.5,0,WORLD_W-logicalW);viewY=clamp(p.y-logicalH*.44,0,WORLD_H-logicalH);
    hideModal();save(true);flash(isDeath?'쓰러져서 시작 지점에서 부활했어요':'시작 지점 X 0 · Y 0으로 리스폰했어요');
  }
  function beginLadder(){if(!s.inv.ladder){flash('사다리가 없어요');return;}mode='ladder';hideModal();flash('근처 지하 빈 칸을 터치해 사다리를 설치하세요');}
  function placeLadder(c,r){if(c<0||c>=COLS||r<surfaceRows[c]||r>=ROWS||tileAt(c,r)||!inReach(c,r)){flash('가까운 지하 빈 칸을 터치하세요');return;}
    if(s.ladders.some(a=>a.c===c&&a.r===r)){flash('이미 사다리가 있어요');return;}
    s.ladders.push({c,r});s.inv.ladder--;mode=s.inv.ladder?'ladder':null;flash('사다리 설치 완료');}

  function showModal(title,html){$('modal-title').textContent=title;$('modal-body').innerHTML=html;$('overlay').classList.add('open');}
  function hideModal(){$('overlay').classList.remove('open');}
  const slotNames={helmet:'헬멧',armor:'갑옷',legs:'바지',boots:'신발',tool:'곡괭이',weapon:'무기',light:'등불'};
  const slotIcons={helmet:'◕',armor:'▣',legs:'▥',boots:'◧',tool:'⛏',weapon:'⚔',light:'✧'};
  const itemIcons={stone:'▧',dirt:'▦',wood:'▥',metal:'⬡',copper:'◆',iron:'⬢',fiber:'❀',crystal:'✦',food:'◉',medkit:'⚕',ladder:'╫',chest:'▣',basicSword:'⚔',sword:'⚔',spear:'♠',basicPickaxe:'⛏',pickaxe:'⛏',copperPickaxe:'⛏',ironPickaxe:'⛏',armor:'▣',helmet:'◕',leggings:'▥',boots:'◧',lamp:'✧'};
  const bagItems=['stone','dirt','wood','metal','copper','iron','fiber','crystal','food','medkit','ladder','chest'];
  function bagCount(id){return gear[id]?Number(!!s.ownedGear[id]):id==='food'?s.food:(s.inv[id]||0);}
  function showBag(){const id=bagItems.includes(s.selectedItem)?s.selectedItem:'stone',count=bagCount(id);
    const title=names[id],description=['stone','dirt','wood'].includes(id)?'블록으로 설치할 수 있어요.':id==='medkit'?'체력 35 회복':id==='food'?'허기 30 회복':id==='ladder'?'지하 빈 공간에 배치할 수 있어요.':id==='chest'?'지상에 놓고 재료를 넣고 꺼내는 상자예요.':'제작과 건설에 사용하는 재료예요.';
    const action=['stone','dirt','wood'].includes(id)?`<button data-place="${id}" ${!count?'disabled':''}>블록 설치</button>`:
      id==='medkit'?`<button data-use="medkit" ${!count||s.hp>=100?'disabled':''}>회복약 사용</button>`:
      id==='food'?`<button data-use="food" ${!count||s.hunger>=100?'disabled':''}>먹기</button>`:
      id==='ladder'?`<button data-use="ladder" ${!count?'disabled':''}>사다리 배치</button>`:
      id==='chest'?`<button data-use="chest" ${!count?'disabled':''}>상자 배치</button>`:'';
    showModal('🎒 가방',`
      <p class="section-note">채집한 재료와 소비품을 보관합니다. 무기와 방어구는 아래의 장비 버튼에서 변경하세요.</p>
      <h3>아이템 칸</h3><div class="bag-grid">${bagItems.map(key=>{const qty=bagCount(key);return `<button class="bag-cell ${key===id?'selected':''} ${qty?'':'empty'}" data-select="${key}" aria-label="${gear[key]?.name||names[key]} ${qty}개"><span class="bag-icon">${itemIcons[key]}</span><span class="bag-qty">${qty||''}</span></button>`;}).join('')}</div>
      <div class="bag-detail"><div><b>${itemIcons[id]} ${title}</b><small>${description} · ${count}개 보유</small></div>${action}</div>
      <p class="hint">돌·흙·나무를 고르고 블록 설치를 누르면 가까운 빈 칸에 놓을 수 있어요.</p>`);}
  function showEquipment(){showModal('⚔ 장비',`<p class="section-note">가방과 별도로 무기·곡괭이·방어구를 장착합니다.</p>
    <div class="equipment-layout"><div class="body-slots">${['helmet','armor','legs','boots'].map(slot=>`<div class="equip-slot"><span class="equip-icon">${slotIcons[slot]}</span><span>${slotNames[slot]}<b>${gear[s.equipped[slot]]?.name||'빈 칸'}</b></span></div>`).join('')}</div><div class="hand-slots">${['tool','weapon','light'].map(slot=>`<div class="equip-slot"><span class="equip-icon">${slotIcons[slot]}</span><span>${slotNames[slot]}<b>${gear[s.equipped[slot]]?.name||'빈 칸'}</b></span></div>`).join('')}</div></div>
    <h3>보유한 장비</h3>${Object.entries(gear).filter(([id])=>s.ownedGear[id]).map(([id,g])=>`<div class="recipe"><div><b>${itemIcons[id]} ${g.name}</b><small>${g.detail}</small></div><button data-equip="${id}" ${s.equipped[g.slot]===id?'disabled':''}>${s.equipped[g.slot]===id?'장착 중':'장착'}</button></div>`).join('')}
    <p class="hint">새 곡괭이와 방어구는 도구 제작대에서, 등불은 제작소에서 만듭니다.</p>`);}
  function showDrafting(){const ready=draftingReady(),exists=s.sites.some(a=>a.kind==='drafting'&&a.done);
    showModal('⌑ 설계도 제작',`<p class="hint">${ready?'작업대에서 설계도를 만들 수 있어요.':exists?'완성된 설계도 작업대 가까이 이동하세요.':'먼저 설계도 창에서 설계도 작업대를 설치하고 재료를 넣어 완성하세요.'}</p>
      ${Object.entries(plans).map(([kind,p])=>`<div class="recipe"><div><b>${buildings[kind].icon} ${buildings[kind].name} 설계도</b><small>재료: ${costText(p.cost)} · 가방 ${s.blueprints[kind]||0}개</small></div><button data-plan="${kind}" ${!ready||!canPay(p.cost)?'disabled':''}>제작</button></div>`).join('')}
      ${!exists?'<button data-build="drafting">설계도 작업대 설치</button>':''}`);}
  function showBuild(){const available=Object.entries(plans).filter(([kind])=>(s.blueprints[kind]||0)>0);
    showModal('▣ 설계도',`<p class="hint">처음에는 설계도 작업대를 설치하세요. 다른 설계도는 작업대에서 만든 뒤 여기 나타납니다.</p>
      <div class="recipe"><div><b>⌑ 설계도 작업대</b><small>시작 설계도 · 건설 재료: ${costText(buildings.drafting.cost)}</small></div><button data-build="drafting">선택</button></div>
      ${available.map(([kind])=>{const b=buildings[kind];return `<div class="recipe"><div><b>${b.icon} ${b.name} <span class="badge">×${s.blueprints[kind]}</span></b><small>건설 재료: ${costText(b.cost)}</small></div><button data-build="${kind}">선택</button></div>`;}).join('')}
      ${!available.length?'<p class="section-note">제작한 다른 설계도가 아직 없어요.</p>':''}`);}
  function showCraft(){const ready=workshopReady(),toolReady=toolbenchReady();
    const rows=(isTool)=>Object.entries(crafts).filter(([key])=>toolCrafts.has(key)===isTool).map(([key,r])=>{
      const owned=!!gear[key]&&s.ownedGear[key];return `<div class="recipe"><div><b>${r.name}</b><small>${r.description}<br>${costText(r.cost)}</small></div><button data-craft="${key}" ${!(isTool?toolReady:ready)||owned||!canPay(r.cost)?'disabled':''}>${owned?'보유':'제작'}</button></div>`;}).join('');
    showModal('⚙ 아이템 제작',`<h3>⚒ 도구 제작대</h3><p class="section-note">${toolReady?'가까운 도구 제작대에서 장비 제작 가능':'설계도 작업대에서 도구 제작대 설계도를 만든 뒤 건설하세요.'}</p>${rows(true)}
    <h3>⚙ 제작소</h3><p class="section-note">${ready?'가까운 제작소에서 제작 가능':'제작소를 건설하고 가까이 이동하세요.'}</p>${rows(false)}`);}
  function showSettings(){showModal('⚙ 설정',`<div class="settings-row"><div><b>조이스틱 크기</b><br><span class="section-note">작게 ← → 크게 · 최대 200</span></div><input type="range" min="80" max="200" step="4" data-setting="joystick" value="${s.settings.joystickSize}" aria-label="조이스틱 크기"><span id="size-value">${s.settings.joystickSize}</span></div>
    <p class="hint">크기 설정은 자동으로 저장됩니다. 작은 화면에서는 버튼과 겹치지 않도록 크기가 조절됩니다.</p><div class="settings-row"><span>현재 진행 상황</span><button data-save="1">저장</button></div>
    <div class="settings-row"><div><b>리스폰 · 시작 지점으로</b><br><span class="section-note">X 0 · Y 0으로 이동하고 체력이 회복됩니다. 가방·건물·진행 상황은 유지됩니다.</span></div><button data-respawn="1">리스폰</button></div>`);}
  const roleName={haul:'운반·건설',gather:'채집',guard:'경비'};
  function showAllies(){showModal('✦ 동료',`<p class="hint">완성된 침대 하나당 동료 한 명을 모집할 수 있어요. 모집 비용은 식량 2개입니다.</p>
    <div class="recipe"><div>동료 ${s.allies.length}명 · 완성 침대 ${s.sites.filter(a=>a.kind==='bed'&&a.done).length}개</div><button data-recruit="1">모집</button></div>
    ${s.allies.map((a,i)=>`<div class="recipe"><div><b>${i+1}번 동료 · ♥${Math.ceil(a.hp)}/40</b><small>${roleName[a.role]||'운반·건설'}</small></div><button data-role="${i}">역할 변경</button></div>`).join('')}`);}
  $('modal-body').addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.build){mode=b.dataset.build;hideModal();flash(`${buildings[mode].name} 설계도: 지상의 빈 곳을 터치하세요`);}
    if(b.dataset.plan)createPlan(b.dataset.plan);
    if(b.dataset.craft)craft(b.dataset.craft);
    if(b.dataset.select){s.selectedItem=b.dataset.select;showBag();}
    if(b.dataset.equip&&s.ownedGear[b.dataset.equip]){const g=gear[b.dataset.equip];s.equipped[g.slot]=b.dataset.equip;save(true);showEquipment();flash(`${g.name} 장착 완료`);}
    if(b.dataset.place)beginBlock(b.dataset.place);
    if(b.dataset.use==='medkit')useMedkit();
    if(b.dataset.use==='food')eatFood();
    if(b.dataset.use==='ladder')beginLadder();
    if(b.dataset.use==='chest')beginChest();
    if(b.dataset.store)transferChest(b.dataset.store,'store');
    if(b.dataset.storeAll)transferChest(b.dataset.storeAll,'store',true);
    if(b.dataset.take)transferChest(b.dataset.take,'take');
    if(b.dataset.save)save();
    if(b.dataset.respawn)respawn();
    if(b.dataset.recruit)recruit();
    if(b.dataset.role){let a=s.allies[Number(b.dataset.role)],roles=['haul','gather','guard'];a.role=roles[(roles.indexOf(a.role)+1)%3];showAllies();flash(`동료 역할: ${roleName[a.role]}`);}
  });
  $('modal-body').addEventListener('input',e=>{if(e.target.dataset.setting!=='joystick')return;
    s.settings.joystickSize=clamp(Number(e.target.value),80,200);
    document.documentElement.style.setProperty('--joy-size',`${s.settings.joystickSize}px`);
    $('size-value').textContent=s.settings.joystickSize;save(true);
  });
  $('close').onclick=hideModal;$('overlay').addEventListener('pointerdown',e=>{if(e.target===$('overlay'))hideModal();});
  $('bag').onclick=showBag;$('equipment').onclick=showEquipment;$('awards').onclick=showAwards;$('drafting').onclick=showDrafting;$('build').onclick=showBuild;$('craft').onclick=showCraft;$('allies').onclick=showAllies;$('settings').onclick=showSettings;
  $('cancel-mode').onclick=()=>{mode=null;previewX=null;flash('선택을 취소했어요');};
  $('speed').onclick=()=>{speed=speed===1?10:1;$('speed').textContent=`×${speed}`;flash(`시간 속도 ×${speed}`);};
  document.documentElement.style.setProperty('--joy-size',`${clamp(s.settings.joystickSize,80,200)}px`);
  const joy=$('joystick'),stick=$('stick');
  function updateJoystick(e){const box=joy.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2;
    let dx=(e.clientX-cx)/(box.width*.34),dy=(e.clientY-cy)/(box.height*.34),mag=Math.hypot(dx,dy);
    if(mag>1){dx/=mag;dy/=mag;}joystick.x=dx;joystick.y=dy;
    stick.style.transform=`translate(${dx*box.width*.31}px,${dy*box.height*.31}px)`;}
  joy.addEventListener('pointerdown',e=>{e.preventDefault();joy.setPointerCapture(e.pointerId);joystick.pointer=e.pointerId;updateJoystick(e);});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===joystick.pointer)updateJoystick(e);});
  const releaseJoy=e=>{if(e.pointerId!==joystick.pointer)return;joystick={x:0,y:0,pointer:null};stick.style.transform='translate(0,0)';};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(type,releaseJoy);
  function holdButton(id,key,action){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held[key]=true;action();});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>held[key]=false);}
  holdButton('mine','mine',()=>{mineCooldown=.28;mine();});
  holdButton('attack','attack',()=>{attackCooldown=.39;attack();});
  $('jump').addEventListener('pointerdown',e=>{e.preventDefault();jump();});
  const keyboard={left:false,right:false,down:false,up:false};
  addEventListener('keydown',e=>{if(['a','ArrowLeft'].includes(e.key))keyboard.left=true;
    if(['d','ArrowRight'].includes(e.key))keyboard.right=true;
    if(['s','ArrowDown'].includes(e.key)){keyboard.down=true;joystick.y=1;}
    if(['w','ArrowUp'].includes(e.key))keyboard.up=true;
    if(e.code==='Space'&&!e.repeat){e.preventDefault();jump();}
    if(e.key.toLowerCase()==='e'&&!e.repeat)mine();
    if(e.key.toLowerCase()==='f'&&!e.repeat)attack();
    if(e.key.toLowerCase()==='i'&&!e.repeat)showBag();});
  addEventListener('keyup',e=>{if(['a','ArrowLeft'].includes(e.key))keyboard.left=false;
    if(['d','ArrowRight'].includes(e.key))keyboard.right=false;
    if(['s','ArrowDown'].includes(e.key)){keyboard.down=false;joystick.y=0;}
    if(['w','ArrowUp'].includes(e.key))keyboard.up=false;});
  function eventWorld(e){const bounds=canvas.getBoundingClientRect();return {x:(e.clientX-bounds.left)*logicalW/bounds.width+viewX,y:(e.clientY-bounds.top)*logicalH/bounds.height+viewY};}
  canvas.addEventListener('pointermove',e=>{if(mode&&mode!=='ladder')previewX=eventWorld(e).x;});
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();const p=eventWorld(e),c=Math.floor(p.x/TILE),r=Math.floor((p.y-ORIGIN)/TILE);
    if(mode==='chest'){if(Math.abs(p.y-groundY(p.x))<85)placeChest(p.x);else flash('지상의 평평한 땅을 터치하세요');return;}
    if(mode==='ladder'){placeLadder(c,r);return;}
    if(mode?.startsWith('place:')){placeBlock(c,r,mode.slice(6));return;}
    if(mode&&buildings[mode]){if(Math.abs(p.y-groundY(p.x))>85)flash('지상의 평평한 곳을 터치하세요');else build(p.x,mode);return;}
    const chest=s.chests.find(a=>Math.abs(a.x-p.x)<23&&p.y>=groundY(a.x)-38&&p.y<=groundY(a.x)+6);
    if(chest){showChest(chest);return;}
    if(c>=0&&c<COLS&&r>=0&&r<ROWS&&tileAt(c,r)&&inReach(c,r)){targetTile={c,r};flash('선택한 블록을 채집 버튼으로 파세요');}
    else targetTile=null;
  });

  function update(dt){const p=s.player,gameDt=Math.min(dt,.05)*speed;
    let move=clamp(joystick.x+(keyboard.right?1:0)-(keyboard.left?1:0),-1,1);
    if(Math.abs(move)<.12)move=0;if(move)p.facing=Math.sign(move);
    moveAxis(move*(s.equipped.boots==='boots'?173:154)*dt,'x');
    const ladder=s.ladders.some(a=>Math.abs((a.c+.5)*TILE-p.x)<17&&Math.abs(ORIGIN+(a.r+.5)*TILE-(p.y+12))<30);
    if(ladder&&(joystick.y<-.25||keyboard.up)){p.vy=0;moveAxis(-105*dt,'y');}
    else{p.vy=clamp(p.vy+710*dt,-380,370);if(moveAxis(p.vy*dt,'y'))p.vy=0;}
    if(held.mine){mineCooldown-=dt;if(mineCooldown<=0){mine();mineCooldown=.28;}}
    if(held.attack){attackCooldown-=dt;if(attackCooldown<=0){attack();attackCooldown=.39;}}
    const prev=Math.floor(s.time/CYCLE);s.time+=gameDt;
    s.hunger=Math.max(0,s.hunger-gameDt*.035);
    painTimer=Math.max(0,painTimer-dt);hurtClock=Math.max(0,hurtClock-dt);deathClock=Math.max(0,deathClock-dt);
    const currentBiome=biomeAt(p.x);
    if(currentBiome!==s.lastBiome){s.lastBiome=currentBiome;s.tempClock=0;}
    s.tempClock+=dt;
    while(s.tempClock>=10){s.tempClock-=10;const biome=currentBiome;
      if(biome==='desert')s.temperature=Math.round((s.temperature+.1)*10)/10;
      else if(biome==='tundra')s.temperature=Math.round((s.temperature-.1)*10)/10;
      else s.temperature=Math.round((s.temperature+Math.sign(36.5-s.temperature)*Math.min(.1,Math.abs(36.5-s.temperature)))*10)/10;
    }
    if(s.hunger===0)takeDamage(gameDt*.12);
    if(s.temperature>=39||s.temperature<=34)takeDamage(gameDt*.12);
    if(s.hp<=0){respawn(true);return;}
    if(Math.floor(s.time/CYCLE)>prev){s.day++;
      s.food=Math.max(0,s.food-Math.max(1,Math.ceil(s.allies.length/2)));
      for(const site of s.sites)if(site.done&&site.kind==='farm')s.food+=3;
      if(s.sites.some(a=>a.done&&a.kind==='bed'))for(const ally of s.allies)ally.hp=Math.min(40,ally.hp+5);
      flash(`${s.day}일차 낮 · 식량 소비와 재배실 수확`);}
    if(phase()==='밤'){spawnCooldown-=gameDt;if(spawnCooldown<=0){spawnCooldown=clamp(13-s.day*.65,3,13);
      let center=nearSurface()?p.x:880;
      let x=Math.random()<.5?clamp(center-random(400,590),20,WORLD_W-20):clamp(center+random(400,590),20,WORLD_W-20);
      s.enemies.push({x,hp:26+s.day*4,strike:0});}}
    else spawnCooldown=0;
    for(const site of s.sites){if(site.done||!supplied(site))continue;
      const workers=s.allies.filter(a=>a.role==='haul'&&Math.abs(a.x-site.x)<80).length;
      site.progress+=gameDt*((nearSite(site,115)?1:0)+workers*.7);
      if(site.progress>=buildings[site.kind].work){site.done=true;s.stats.buildingsBuilt++;held.mine=false;checkAwards();flash(`${buildings[site.kind].name} 완성!`);}}
    for(const a of s.allies){a.work=(a.work||0)-gameDt;let destination=880;
      if(a.role==='haul'){const site=s.sites.find(t=>!t.done);if(site){destination=site.x-24;
        if(Math.abs(a.x-site.x)<70&&a.work<=0&&!supplied(site)){deliver(site,false);a.work=2;}}}
      else if(a.role==='gather'&&phase()==='낮'){let resource=s.resources.filter(t=>Math.abs(t.x-a.x)<230).sort((u,v)=>Math.abs(u.x-a.x)-Math.abs(v.x-a.x))[0];
        if(resource){destination=resource.x;if(Math.abs(a.x-resource.x)<27&&a.work<=0){collect(resource);a.work=4;}}}
      else if(a.role==='guard')destination=880+(s.allies.indexOf(a)%3-1)*70;
      a.x+=Math.sign(destination-a.x)*Math.min(Math.abs(destination-a.x),78*gameDt);
      const enemy=s.enemies.find(e=>Math.abs(e.x-a.x)<70);
      if(enemy&&a.work<=0){damageEnemy(enemy,12);a.work=1;}
    }
    for(const enemy of [...s.enemies]){enemy.strike-=gameDt;enemy.breakClock=(enemy.breakClock||0)-gameDt;enemy.hitFlash=Math.max(0,(enemy.hitFlash||0)-dt);
      const wall=s.sites.find(a=>a.done&&a.kind==='wall'&&Math.abs(a.x-enemy.x)<33);
      const tx=wall?wall.x:(nearSurface()?p.x:880);
      const direction=Math.sign(tx-enemy.x),block=blockInEnemyPath(enemy,direction);
      if(block){if(enemy.breakClock<=0){enemy.breakClock=.85;
          s.enemyDamage[block.key]=(s.enemyDamage[block.key]||0)+1;
          blockImpact={c:block.c,r:block.r,life:.2};
          if(s.enemyDamage[block.key]>=Math.max(3,blockHp(s.placedBlocks[block.key]))){
            delete s.placedBlocks[block.key];delete s.enemyDamage[block.key];delete s.damage?.[block.key];
            if(Math.abs(enemy.x-p.x)<160)flash('몬스터가 설치한 블록을 부쉈어요');
          }
        }}
      else enemy.x+=direction*clamp(40+s.day*2,40,87)*gameDt;
      if(nearSurface()&&Math.abs(enemy.x-p.x)<26&&Math.abs(groundY(enemy.x)-p.y-28)<52&&enemy.strike<=0){
        const protection=(s.equipped.armor==='armor'?3:0)+(s.equipped.helmet==='helmet'?1:0)+(s.equipped.legs==='leggings'?1:0)+(s.equipped.boots==='boots'?1:0);
        takeDamage(Math.max(2,10-protection),true);enemy.strike=1.2;
        damageFloats.push({x:p.x,y:p.y-12,text:'피격!',life:.7,color:'#ff8e9b'});
        if(s.hp<=0){respawn(true);break;}}
      else if(enemy.strike<=0){const ally=s.allies.find(a=>Math.abs(a.x-enemy.x)<25);
        if(ally){ally.hp=Math.max(0,ally.hp-6);enemy.strike=1.2;
          damageFloats.push({x:ally.x,y:groundY(ally.x)-40,text:'-6',life:.75,color:'#ff9a9a'});
          if(ally.hp<=0){s.allies.splice(s.allies.indexOf(ally),1);flash('동료가 쓰러졌어요');}
        }}
    }
    if(s.resources.length<125&&Math.random()<gameDt*.3)addResource();
    s.stats.maxDistance=Math.max(s.stats.maxDistance,Math.floor(Math.abs(p.x-SPAWN_X)/TILE));
    s.stats.maxDepth=Math.max(s.stats.maxDepth,Math.floor(Math.max(0,p.y+24-groundY(p.x))/TILE));
    checkAwards();hitClock=Math.max(0,hitClock-dt);
    if(blockImpact)blockImpact.life-=dt;
    for(let i=damageFloats.length-1;i>=0;i--){damageFloats[i].life-=dt;damageFloats[i].y-=29*dt;if(damageFloats[i].life<=0)damageFloats.splice(i,1);}
    saveClock+=dt;if(saveClock>12){save(true);saveClock=0;}
    if(toastClock>0){toastClock-=dt;if(toastClock<=0)$('toast').classList.remove('show');}
    viewX=clamp(p.x-logicalW*.5,0,WORLD_W-logicalW);
    viewY=clamp(p.y-logicalH*.44,0,WORLD_H-logicalH);
  }

  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function text(str,x,y,size=12,color='#edf5ea'){ctx.font=`bold ${size}px monospace`;ctx.fillStyle=color;ctx.fillText(str,Math.round(x),Math.round(y));}
  function drawBackground(){const night=phase()==='밤';let sky=ctx.createLinearGradient(0,0,0,400);
    sky.addColorStop(0,night?'#111c3b':'#2c5371');sky.addColorStop(1,night?'#494063':'#a08080');
    ctx.fillStyle=sky;ctx.fillRect(0,-100,WORLD_W,550);
    rect(3000,-100,2300,550,night?'#ab846722':'#e4b17b38');
    rect(7500,-100,3000,550,night?'#92bccc22':'#d1eff044');
    const left=Math.max(0,Math.floor(viewX/TILE)-1),right=Math.min(COLS-1,Math.ceil((viewX+logicalW)/TILE)+1);
    for(let c=left;c<=right;c++){const x=c*TILE,y=groundY(x);
      rect(x,y,TILE,WORLD_H-y,'#192837');
      const mist=ctx.createLinearGradient(0,y-55,0,y+8);
      mist.addColorStop(0,'#a2b2b000');mist.addColorStop(1,night?'#78808f35':'#b2c6b94d');
      ctx.fillStyle=mist;ctx.fillRect(x,y-55,TILE,63);
    }
    for(let i=0;i<580;i++){const x=(i*373+83)%WORLD_W,y=11+(i*79)%280;
      if(y<groundY(x)-17)rect(x,y,i%8===0?3:2,2,night?'#c6def0':'#9cbfc8');}
    for(let i=0;i<65;i++){const zone=i<30?'desert':'tundra',base=zone==='desert'?3000:7500,span=zone==='desert'?2300:3000;
      const x=base+(i*317+performance.now()*(zone==='desert'?.009:.003))%span,y=(i*79+performance.now()*.015)%280;
      if(y<groundY(x)-15)rect(x,y,zone==='desert'?4:3,zone==='desert'?1:3,zone==='desert'?'#f2d9a77d':'#e2f9efcc');}
    rect(1650,35,65,65,night?'#b6a4b7':'#d0bfa2');
    rect(1662,44,18,13,night?'#817897':'#aaa08e');
    for(let i=0;i<138;i++){const x=i*91+(i*37)%27,height=48+Math.floor(hash(i,3)*95),width=29+Math.floor(hash(i,9)*43),y=groundY(x);
      rect(x,y-height,width,height,night?'#2c3e5b':'#4b6878');
      rect(x+6,y-height-10,width-13,13,night?'#5a6982':'#8da1a2');
      if(i%4===0)rect(x+width/2-3,y-height-29,6,20,'#8198a7');}
    for(let i=0;i<138;i++){const x=i*88+19,v=hash(i,17),biome=Math.floor(x/760)%3,y=groundY(x),zone=biomeAt(x);
      if(zone==='desert'){rect(x-2,y-27,9,27,'#4b8772');rect(x-8,y-20,7,5,'#6bac83');rect(x-8,y-23,3,9,'#4b8772');rect(x+5,y-15,8,5,'#6bac83');rect(x+10,y-19,3,9,'#4b8772');continue;}
      if(zone==='tundra'){rect(x+1,y-37,5,37,'#536c72');rect(x-18,y-26,40,12,'#527b80');rect(x-13,y-41,30,13,'#6b969b');rect(x-7,y-54,18,16,'#a8ced1');rect(x-19,y-28,38,4,'#e1ecdd');continue;}
      if(v>.55){const height=43+Math.floor(v*50),width=23+Math.floor(hash(i,8)*25);
        rect(x+width/2-3,y-height+13,6,height-13,biome===1?'#536c75':'#536e66');
        rect(x,y-height,width,15,biome===1?'#758bb2':biome===2?'#a1749f':'#81ac9c');
        rect(x+6,y-height-8,width-12,10,biome===1?'#acb4d0':biome===2?'#c89fbb':'#abcfc0');
        rect(x+8,y-height+7,3,3,'#e5d9b6');}
      else{rect(x+2,y-20,5,20,'#507e6e');rect(x-5,y-27,21,12,biome===2?'#a780ad':'#81b99d');}}
    for(const x of [316,1280,2040,3310,4860,5600,7120,8360,10320,11480]){const y=groundY(x);
      rect(x-16,y-35,33,35,'#637d8c');rect(x-9,y-63,20,30,'#85b8bd');
      rect(x-3,y-89,8,28,'#a2e1d4');rect(x+6,y-42,14,16,'#709caf');}
    for(const x of [600,1770,3890,5280,6940,8550,10560]){const y=groundY(x);
      rect(x-31,y-67,12,67,'#677b85');rect(x+20,y-67,12,67,'#677b85');
      rect(x-30,y-76,62,12,'#8fa1a1');rect(x-4,y-92,9,16,'#a2c3b8');}
  }
  function drawTerrain(){const left=Math.max(0,Math.floor(viewX/TILE)-1),right=Math.min(COLS-1,Math.ceil((viewX+logicalW)/TILE)+1);
    const top=Math.max(0,Math.floor((viewY-ORIGIN)/TILE)-1),bottom=Math.min(ROWS-1,Math.ceil((viewY+logicalH-ORIGIN)/TILE)+1);
    for(let r=top;r<=bottom;r++)for(let c=left;c<=right;c++){
      const type=tileAt(c,r),shake=(hitClock>0&&hitTile?.c===c&&hitTile?.r===r)||(blockImpact?.life>0&&blockImpact.c===c&&blockImpact.r===r),x=c*TILE+(shake?Math.round(Math.sin(performance.now()/20)*2):0),y=ORIGIN+r*TILE,noise=hash(c,r);
      if(type===0){if(r>=0){rect(x,y,TILE,TILE,'#1a2b38');if(noise>.68)rect(x+5,y+6,3,3,'#47666d');}continue;}
      const biome=Math.floor(c*TILE/760)%3,zone=biomeAt(c*TILE);
      const colors={1:zone==='desert'?'#ad8459':zone==='tundra'?'#596f79':r===surfaceRows[c]?['#695c53','#70605b','#745962'][biome]:'#68564f',2:zone==='desert'?'#7d6858':zone==='tundra'?'#50687b':['#44566a','#4a5b70','#504c66'][biome],3:'#4d6275',4:'#4b536c',5:'#806857',6:'#946d54',7:'#637683'};
      rect(x,y,TILE-1,TILE-1,colors[type]);
      rect(x+2,y+2,13+noise*6,2,type===1?'#a18170':type===5?'#ae906c':'#617488');
      if(noise>.32)rect(x+4+(noise*5|0),y+15,7+noise*4,2,'#34475a');
      else{rect(x+5,y+10,3,3,'#647888');rect(x+15,y+17,3,2,'#334a5a');}
      if(type===1&&r===surfaceRows[c]&&!s.placedBlocks[`${c},${r}`]){rect(x,y,TILE,5,zone==='desert'?'#dfbc80':zone==='tundra'?'#cbe4e1':'#7fa88e');rect(x+7,y-3,4,4,zone==='desert'?'#efd9ac':zone==='tundra'?'#effbfa':'#a9c3a0');}
      if(type===5){rect(x+5,y+4,2,13,'#a58768');rect(x+14,y+4,2,13,'#a58768');}
      if(type===3){rect(x+4,y+5,6,7,'#78b2bd');rect(x+13,y+12,5,5,'#9bd0cf');}
      if(type===6){rect(x+4,y+5,7,7,'#dd9862');rect(x+13,y+12,5,4,'#f2b27a');}
      if(type===7){rect(x+5,y+4,7,8,'#a5c7cc');rect(x+13,y+12,5,5,'#d2e1d8');}
      if(type===4){rect(x+6,y+3,7,14,'#a88fd2');rect(x+11,y+7,6,10,'#c9b9ed');}
      const dmg=s.damage?.[`${c},${r}`];if(dmg){rect(x+3,y+11,12,2,'#1d2c40');rect(x+13,y+7,2,14,'#1d2c40');}
      const enemyDmg=s.enemyDamage[`${c},${r}`];if(enemyDmg){rect(x+3,y+5,13,2,'#e48a79');rect(x+8,y+6,2,11,'#ac544c');}
    }
    for(const a of s.ladders){let x=a.c*TILE+3,y=ORIGIN+a.r*TILE;
      rect(x,y,3,TILE,'#c5a570');rect(x+11,y,3,TILE,'#c5a570');for(let j=0;j<3;j++)rect(x,y+4+j*6,14,2,'#dfc08c');}
  }
  function drawResources(){for(const a of s.resources){let x=a.x,y=groundY(a.x);
    if(a.type==='fiber'){rect(x-3,y-28,6,28,'#699280');rect(x-12,y-36,24,15,'#a6c8a0');rect(x+4,y-45,7,16,'#7bb5a0');}
    else if(a.type==='food'){rect(x-3,y-21,6,21,'#557e69');rect(x-12,y-32,24,14,'#6ba780');rect(x-8,y-27,5,5,'#ef9b9e');rect(x+4,y-25,5,5,'#ef9b9e');}
    else if(a.type==='wood'&&biomeAt(x)==='desert'){rect(x-6,y-62,12,62,'#6a876a');rect(x-20,y-46,16,9,'#83ad78');rect(x-19,y-53,7,20,'#5d8d68');rect(x+5,y-35,16,9,'#83ad78');rect(x+15,y-44,7,17,'#5d8d68');}
    else if(a.type==='wood'){rect(x-7,y-58,14,58,'#80604d');rect(x-4,y-55,4,49,'#af896b');rect(x-16,y-57,12,5,'#826752');
      rect(x-24,y-80,48,20,'#547d70');rect(x-19,y-98,38,24,'#79a28a');rect(x-12,y-110,26,16,'#9ac2a1');
      rect(x-20,y-78,8,8,'#aad1a4');rect(x+10,y-85,10,10,'#a1c99a');if(biomeAt(x)==='tundra')rect(x-19,y-99,40,5,'#e1f2eb');}
    else{rect(x-13,y-20,26,20,'#70869a');rect(x-6,y-29,14,13,a.type==='metal'?'#8bd0d5':'#b8a3b8');rect(x+4,y-12,5,5,'#d2e0dc');}}
  }
  function drawChests(){for(const chest of s.chests){const x=chest.x,y=groundY(x);
    rect(x-17,y-25,34,25,'#77533b');rect(x-19,y-30,38,8,'#aa8051');
    rect(x-17,y-8,34,4,'#a17045');rect(x-3,y-25,6,13,'#e6c382');rect(x-2,y-20,4,5,'#5b483d');
    if(Math.abs(s.player.x-x)<100&&nearSurface())text('터치해서 열기',x-28,y-37,9,'#ffe6ad');
  }}
  function drawSites(){for(const a of s.sites){const info=buildings[a.kind],x=a.x-info.w/2,y=groundY(a.x)-info.h;
    if(!a.done){ctx.globalAlpha=.5;rect(x,y,info.w,info.h,'#72dad9');ctx.globalAlpha=1;
      ctx.strokeStyle='#c5f6e9';ctx.setLineDash([5,4]);ctx.strokeRect(x,y,info.w,info.h);ctx.setLineDash([]);
      const count=Object.entries(info.cost).reduce((n,[k,v])=>n+Math.min(v,a.put[k]||0),0),total=Object.values(info.cost).reduce((u,v)=>u+v,0);
      rect(x,y-12,info.w,6,'#18283b');rect(x,y-12,info.w*(count/total),6,'#e4c17c');
      text(`${info.name} ${count}/${total}`,x,y-19,11);
    }else if(a.kind==='drafting'){rect(x,y+24,info.w,info.h-24,'#675e67');rect(x+8,y+17,info.w-16,12,'#bd9d7a');
      rect(x+19,y+7,48,13,'#d7c6a3');rect(x+26,y+10,25,2,'#758493');rect(x+13,y+46,16,12,'#91bdc4');}
    else if(a.kind==='workshop'){rect(x,y+18,info.w,info.h-18,'#4e6574');rect(x+5,y+5,info.w-10,19,'#92b9b1');
      rect(x+10,y+31,29,26,'#243c52');rect(x+47,y+34,31,19,'#deba80');rect(x+55,y+40,15,6,'#7bbec0');text('⚙',x+34,y+15,17,'#dcecc4');}
    else if(a.kind==='toolbench'){rect(x,y+23,info.w,info.h-23,'#605952');rect(x+5,y+15,info.w-10,13,'#b49b78');
      rect(x+12,y+30,15,20,'#45717b');rect(x+52,y+29,16,21,'#527789');rect(x+30,y+9,23,7,'#aac6c4');text('⚒',x+36,y+9,16,'#e7deaa');}
    else if(a.kind==='bed'){rect(x,y+17,info.w,info.h-17,'#657889');rect(x+5,y+11,info.w-10,17,'#caa883');rect(x+7,y+13,16,10,'#dee2cc');}
    else if(a.kind==='farm'){rect(x,y+23,info.w,25,'#70605c');for(let j=0;j<6;j++){rect(x+j*16+8,y+9,4,17,'#70b992');rect(x+j*16+4,y+5,11,7,'#addd92');}}
    else{rect(x,y,info.w,info.h,'#718792');for(let j=0;j<3;j++)rect(x+6,y+9+j*27,20,15,'#9eafb1');}}
  }
  function drawActors(){for(const a of s.allies){const y=groundY(a.x);rect(a.x-8,y-29,16,29,'#cfaa86');rect(a.x-8,y-36,16,10,'#8dc9c0');rect(a.x-5,y-24,10,5,'#355266');text(a.role==='guard'?'⚔':a.role==='gather'?'✦':'▣',a.x-7,y-42,12);
      rect(a.x-19,y-51,38,5,'#1b303b');rect(a.x-19,y-51,38*a.hp/40,5,'#e57e84');text(`♥${Math.ceil(a.hp)}/40`,a.x-18,y-55,10,'#ffe1d9');}
    for(const e of s.enemies){let x=e.x,y=groundY(x);rect(x-13,y-23,26,23,e.hitFlash>0?'#eebbbb':'#a35b88');rect(x-8,y-31,16,12,e.hitFlash>0?'#ffe3cb':'#bf78a3');rect(x-7,y-18,4,4,'#ffe1a6');rect(x+4,y-18,4,4,'#ffe1a6');rect(x-14,y-38,28,3,'#2f2437');rect(x-14,y-38,28*e.hp/(26+s.day*4),3,'#ec7892');}
    const p=s.player,x=p.x,y=p.y;
    rect(x-7,y+6,14,16,'#ceac91');rect(x-8,y,16,10,'#d9c2a6');rect(x-7,y+10,14,8,'#478399');rect(x-4,y+12,8,4,'#1c3a51');rect(x+p.facing*3,y+4,3,3,'#233249');
    rect(x-8,y+21,6,3,'#334258');rect(x+2,y+21,6,3,'#334258');
    for(const effect of damageFloats){ctx.globalAlpha=Math.min(1,effect.life*2);ctx.font='bold 17px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#251b28';ctx.strokeText(effect.text,effect.x,effect.y);ctx.fillStyle=effect.color;ctx.fillText(effect.text,effect.x,effect.y);ctx.globalAlpha=1;}ctx.textAlign='start';
    const aimed=selectDigTile();if(aimed&&aimed.c>=0&&aimed.c<COLS&&aimed.r>=0&&aimed.r<ROWS){
      const tx=aimed.c*TILE,ty=ORIGIN+aimed.r*TILE,key=`${aimed.c},${aimed.r}`,progress=(s.damage?.[key]||0)/blockHp(tileAt(aimed.c,aimed.r));
      ctx.strokeStyle='rgba(180,239,228,.38)';ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,y+15);ctx.lineTo(tx+TILE/2,ty+TILE/2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=`rgba(122,231,219,${.18+.08*Math.sin(performance.now()/170)})`;ctx.fillRect(tx+1,ty+1,TILE-2,TILE-2);
      ctx.strokeStyle=targetTile?.c===aimed.c&&targetTile?.r===aimed.r?'#ffe4a4':'#a9f5dc';ctx.lineWidth=2;ctx.strokeRect(tx-1,ty-1,TILE+1,TILE+1);
      rect(tx,ty-7,TILE,4,'#102533');rect(tx,ty-7,Math.max(0,TILE*Math.min(1,progress)),4,'#f8ce80');
      if(hitClock>0&&hitTile?.c===aimed.c&&hitTile?.r===aimed.r){for(let i=0;i<4;i++){const angle=i*1.57+hitClock*8;rect(tx+12+Math.cos(angle)*19,ty+12+Math.sin(angle)*19,3,3,'#f5d6a0');}}
    }
    if(mode&&buildings[mode]&&previewX!==null){const b=buildings[mode];ctx.globalAlpha=.45;rect(previewX-b.w/2,groundY(previewX)-b.h,b.w,b.h,'#88e3dc');ctx.globalAlpha=1;}
  }
  function drawDarkness(){const p=s.player;if(p.y<groundY(p.x)-28)return;
    const px=p.x-viewX,py=p.y+14-viewY,depth=clamp((p.y-groundY(p.x))/130,0,.84);
    if(depth<.1)return;
    ctx.fillStyle=`rgba(5,10,21,${depth*.78})`;ctx.fillRect(0,0,logicalW,logicalH);
    const radius=s.equipped.light==='lamp'?230:140;
    const glow=ctx.createRadialGradient(px,py,12,px,py,radius);
    glow.addColorStop(0,'rgba(160,221,211,.35)');glow.addColorStop(.55,'rgba(91,159,162,.15)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(px-radius,py-radius,radius*2,radius*2);
  }
  function drawMinimap(){const m=mapCtx,w=mapCanvas.width,h=mapCanvas.height;
    m.fillStyle='#233f59';m.fillRect(0,0,w,h);
    const yScale=(h-20)/ROWS;
    for(let c=0;c<COLS;c++){const x=c*w/COLS,y=surfaceRows[c]*yScale+16;
      m.fillStyle='#506876';m.fillRect(x,y,Math.ceil(w/COLS)+1,h-y);
      m.fillStyle=biomeAt(c*TILE)==='desert'?'#e9c38c':biomeAt(c*TILE)==='tundra'?'#d7efec':'#a5bea5';m.fillRect(x,y,Math.ceil(w/COLS)+1,2);
      for(const r of [surfaceRows[c]+17,surfaceRows[c]+32])if(s.terrain[r]?.[c]===0){m.fillStyle='#192a3c';m.fillRect(x,16+r*yScale,2,4);}
    }
    for(const site of s.sites){m.fillStyle=site.done?'#f4ce8f':'#96d6d8';m.fillRect(site.x/WORLD_W*w-1,14+surfaceRows[Math.floor(site.x/TILE)]*yScale-3,3,3);}
    for(const chest of s.chests){m.fillStyle='#e6ac66';m.fillRect(chest.x/WORLD_W*w-1,14+surfaceRows[Math.floor(chest.x/TILE)]*yScale-3,3,3);}
    const px=s.player.x/WORLD_W*w,py=16+(s.player.y-ORIGIN)/TILE*yScale;
    m.strokeStyle='#ffffffaa';m.strokeRect(viewX/WORLD_W*w,Math.max(0,16+(viewY-ORIGIN)/TILE*yScale),(logicalW/WORLD_W)*w,(logicalH/TILE)*yScale);
    m.fillStyle='#0a1c29';m.fillRect(px-3,py-3,7,7);m.fillStyle='#fff0ac';m.fillRect(px-2,py-2,5,5);
  }
  function draw(){ctx.setTransform(scale,0,0,scale,0,0);ctx.fillStyle='#142134';ctx.fillRect(0,0,logicalW,logicalH);
    ctx.save();ctx.translate(-viewX,-viewY);drawBackground();drawTerrain();drawResources();drawSites();drawChests();drawActors();ctx.restore();
    drawDarkness();if(phase()==='밤')rect(0,0,logicalW,logicalH,'#10112b22');
    if(hurtClock>0){rect(0,0,logicalW,logicalH,`rgba(199,40,64,${hurtClock*.26})`);
      ctx.strokeStyle=`rgba(255,117,130,${hurtClock})`;ctx.lineWidth=12;ctx.strokeRect(6,6,logicalW-12,logicalH-12);}
    if(deathClock>0)rect(0,0,logicalW,logicalH,`rgba(228,236,247,${Math.min(.65,deathClock*.48)})`);
    drawMinimap();
  }
  function updateHud(){const rem=phase()==='낮'?DAY-s.time%CYCLE:CYCLE-s.time%CYCLE;
    $('clock').textContent=`${phase()==='낮'?'☀ 낮':'☾ 밤'} ${s.day}일차 · ${Math.floor(rem/60)}:${String(Math.floor(rem%60)).padStart(2,'0')} · ♥${Math.ceil(s.hp)}`;
    $('materials').textContent=`돌 ${s.inv.stone}  구리 ${s.inv.copper}  철 ${s.inv.iron}  나무 ${s.inv.wood}  식량 ${s.food}  동료 ${s.allies.length}`;
    $('health-value').textContent=`${Math.ceil(s.hp)}/100`;$('health-fill').style.width=`${clamp(s.hp,0,100)}%`;
    $('hunger-value').textContent=`${Math.ceil(s.hunger)}/100`;$('hunger-fill').style.width=`${clamp(s.hunger,0,100)}%`;
    $('hunger-fill').classList.toggle('low',s.hunger<25);
    $('coordinates').textContent=`⌖ X ${Math.floor((s.player.x-SPAWN_X)/TILE)} · Y ${Math.floor((s.player.y+24-SPAWN_Y)/TILE)}`;
    const biome=biomeAt(s.player.x),temp=$('temperature-panel');
    temp.textContent=`${biome==='desert'?'☀':biome==='tundra'?'❄':'🌿'} ${biomeNames[biome]} · 체온 ${s.temperature.toFixed(1)}℃`;
    temp.classList.toggle('hot',biome==='desert');temp.classList.toggle('cold',biome==='tundra');
    $('awards').textContent=`🏆 ${Object.keys(s.awards).length}`;
    const site=s.sites.find(a=>!a.done&&nearSite(a,90));
    $('status').textContent=site?`${buildings[site.kind].name}: ${Object.entries(buildings[site.kind].cost).map(([k,n])=>`${names[k]} ${site.put[k]||0}/${n}`).join(' · ')}${supplied(site)?' · 건설 중':' · 채집으로 넣기'}`:
      mode==='chest'?'평평한 지면을 터치해 상자 설치':mode==='ladder'?'빈 지하 칸을 터치해 사다리 설치':mode?.startsWith('place:')?`${names[mode.slice(6)]} 설치: 가까운 빈 칸 터치`:
      mode&&buildings[mode]?`${buildings[mode].name} 설계도: 지면 터치`:
      s.player.y>groundY(s.player.x)?'지하 탐험 · 조이스틱 방향으로 채굴':'설계도 작업대를 지어 새로운 설계도 제작';
    $('cancel-mode').style.display=mode?'block':'none';
  }
  function loop(now){const dt=Math.min((now-last)/1000,.06);last=now;update(dt);draw();updateHud();requestAnimationFrame(loop);}
  requestAnimationFrame(loop);
})();
