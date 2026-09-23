(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const mapCanvas=$('minimap'),mapCtx=mapCanvas.getContext('2d');
  const WORLD_W = 24560, ORIGIN = 145, SURFACE = 340, TILE = 20, COLS = WORLD_W / TILE, ROWS = 100;
  const SPAWN_X=880;
  const WORLD_H = ORIGIN + ROWS * TILE;
  const DAY = 540, NIGHT = 240, CYCLE = DAY + NIGHT;
  const names = { stone:'돌', dirt:'흙', wood:'나무', metal:'금속', copper:'구리광석', iron:'철광석', fiber:'섬유', crystal:'발광 수정', food:'식량', medkit:'회복약', ladder:'사다리',chest:'보관 상자' };
  const buildings = {
    outpost:{ name:'전초기지', icon:'⚑', cost:{stone:3,wood:2,fiber:1}, w:94,h:73,work:6 },
    drafting:{ name:'설계도 작업대', icon:'⌑', cost:{stone:3,metal:1,fiber:2}, w:88,h:75,work:7 },
    workshop:{ name:'제작소', icon:'⚙', cost:{stone:4,metal:2,fiber:2}, w:92,h:82,work:8 },
    toolbench:{ name:'도구 제작대', icon:'⚒', cost:{stone:4,wood:3,copper:2,iron:1}, w:86,h:68,work:8 },
    bed:{ name:'침대', icon:'▤', cost:{stone:3,metal:2,fiber:2}, w:70,h:43,work:6 },
    farm:{ name:'재배실', icon:'✿', cost:{stone:2,fiber:5}, w:100,h:48,work:7 },
    wall:{ name:'방벽', icon:'▣', cost:{stone:6,metal:3}, w:32,h:90,work:8 },
    campfire:{ name:'모닥불', icon:'♨', cost:{stone:3,wood:3}, w:45,h:36,work:4 }
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
    farm:{cost:{wood:2,stone:1}}, wall:{cost:{stone:2,dirt:2}}, campfire:{cost:{wood:1,stone:1}}
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
  const initial = () => ({version:12,time:0,day:1,hp:100,hunger:100,temperature:36.5,tempClock:0,lastBiome:'meadow',food:4,
    inv:{stone:5,dirt:4,wood:2,metal:2,copper:0,iron:0,fiber:3,crystal:0,ladder:0,medkit:0,chest:0},
    upgrades:{pickaxe:false,sword:false,lamp:false},
    ownedGear:{basicSword:true,basicPickaxe:true},gearCount:{basicSword:1,basicPickaxe:1},equipped:{weapon:'basicSword',tool:'basicPickaxe',helmet:null,armor:null,legs:null,boots:null,light:null},
    player:{x:880,y:SURFACE-28,vy:0,facing:1},sites:[],allies:[],enemies:[],resources:[],
    terrain:null,ladders:[],placedBlocks:{},enemyDamage:{},chests:[],drops:[],blueprints:{},settings:{joystickSize:108,controlMode:'joystick'},kills:0,nextSiteId:1,nextAllyId:1,pendingBedOffers:[],
    stats:{blocksMined:0,maxDepth:0,woodCollected:0,buildingsBuilt:0,maxDistance:0},awards:{},selectedItem:'stone',hotbar:['stone','dirt','wood','food','medkit','ladder','chest','copper'],hotbarSlot:0});
  let s;
  // 새 월드 규칙을 모두에게 적용한다. 이전 버전의 브라우저 기록은 불러오지 않는다.
  const SAVE_KEY='alien-survival-save-world-2';
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY)) || initial(); } catch { s = initial(); }
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
  s.sites ||= []; s.allies ||= []; s.resources ||= []; s.enemies ||= []; s.ladders ||= [];s.chests||=[];s.drops||=[];
  s.nextSiteId=Number(s.nextSiteId)||1;s.nextAllyId=Number(s.nextAllyId)||1;s.pendingBedOffers||=[];
  for(const site of s.sites){site.id??=s.nextSiteId++;s.nextSiteId=Math.max(s.nextSiteId,site.id+1);
    if(site.kind==='bed'&&site.done)site.completedDay??=s.day;}
  for(const ally of s.allies){ally.id??=s.nextAllyId++;s.nextAllyId=Math.max(s.nextAllyId,ally.id+1);
    ally.role=({guard:'combat',gather:'farmer',haul:'builder'})[ally.role]||ally.role;
    ally.maxHp=Number(ally.maxHp)||Math.max(40,Number(ally.hp)||40);
    ally.hp=Math.max(0,Math.min(ally.maxHp,Number(ally.hp)||ally.maxHp));ally.equipment||={};}
  s.placedBlocks ||= {};s.enemyDamage||={};s.blueprints ||= {};s.settings={...initial().settings,...s.settings};
  if(!['joystick','keyboard'].includes(s.settings.controlMode))s.settings.controlMode='joystick';
  s.stats={...initial().stats,...s.stats};s.awards||={};s.selectedItem||='stone';
  s.hotbar=Array.from({length:8},(_,i)=>initial().hotbar.includes(s.hotbar?.[i])||['metal','iron','fiber','crystal'].includes(s.hotbar?.[i])?s.hotbar[i]:initial().hotbar[i]);
  s.hotbarSlot=Math.max(0,Math.min(7,Number(s.hotbarSlot)||0));
  s.ownedGear={...initial().ownedGear,...s.ownedGear};s.equipped={...initial().equipped,...s.equipped};
  for(const key of ['pickaxe','sword','lamp'])if(s.upgrades[key]){
    s.ownedGear[key]=true;
    if(!s.equipped[gear[key].slot]||s.equipped[gear[key].slot]===initial().equipped[gear[key].slot])s.equipped[gear[key].slot]=key;
  }
  s.gearCount||={};for(const key of Object.keys(gear))if(s.ownedGear[key])s.gearCount[key]=Math.max(1,Number(s.gearCount[key])||0);
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
  function biomeAt(x){const local=x%12280;return local>=3000&&local<5300?'desert':local>=7500&&local<10500?'tundra':'meadow';}
  const biomeNames={meadow:'초원',desert:'사막',tundra:'툰드라'};
  const SPAWN_Y=groundY(SPAWN_X);
  function legacyTerrainTile(c,r){const top=legacySurfaceRow(c);if(r<top)return 0;if(r===top)return 1;
    // 지표면에서 40칸 아래까지는 동굴을 만들지 않는다.
    if(r>=Math.max(top+41,Math.floor((SURFACE-ORIGIN)/TILE)+41)){
      const depth=r-top;
      const chambers=[[35,51,12,4],[91,58,15,6],[143,47,11,4],[205,61,17,6],[238,50,10,4]];
      if(chambers.some(([cx,cy,rx,ry])=>((c%256-cx)/rx)**2+((depth-cy)/ry)**2<1))return 0;
      const tunnelA=49+Math.round(2.3*Math.sin(c/13));
      const tunnelB=65+Math.round(2*Math.sin(c/19));
      if(Math.abs(depth-tunnelA)<=1||Math.abs(depth-tunnelB)<=1)return 0;
      if(hash(Math.floor(c/3),Math.floor(r/3))*.6+hash(c,r)*.4>.80)return 0;
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
  if(oldTerrain?.length===60&&oldTerrain[0]?.length===COLS){
    const deeper=makeTerrain();for(let r=60;r<ROWS;r++)oldTerrain.push(deeper[r]);
  }
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
  s.version=12;
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
  let speed=1,mode=null,targetTile=null,previewX=null,previewY=null;
  let last=performance.now(),mineCooldown=0,gatherCooldown=0,attackCooldown=0,spawnCooldown=0,caveSpawnCooldown=5,saveClock=0,toastClock=0,hitClock=0,hitTile=null,blockImpact=null;
  let hurtClock=0,deathClock=0,painTimer=0,attackFlash=0,craftResult='',craftResultClock=0;
  const damageFloats=[],constructionParticles=[];
  let joystick={x:0,y:0,pointer:null},held={mine:false,gather:false,attack:false};
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
  function save(silent=false) { localStorage.setItem(SAVE_KEY,JSON.stringify(s));if(!silent) flash('게임을 저장했어요'); }
  const phase=()=>s.time%CYCLE<DAY?'낮':'밤';
  const nearSurface=()=>s.player.y<groundY(s.player.x)+45;
  const siteGroundY=site=>site.y??groundY(site.x);
  const nearSite=(site,radius=115)=>Math.abs(s.player.x-site.x)<radius&&Math.abs(s.player.y+24-siteGroundY(site))<85;
  const withinOutpost=(x,y)=>s.sites.some(a=>a.kind==='outpost'&&a.done&&Math.abs(x-a.x)<=18*TILE&&Math.abs(y-siteGroundY(a))<=18*TILE);
  const nearCampfire=()=>s.sites.some(a=>a.kind==='campfire'&&a.done&&Math.hypot(s.player.x-a.x,s.player.y+24-siteGroundY(a))<=8*TILE);
  function dropItem(kind,x,y,count=1){for(let i=0;i<count;i++)s.drops.push({kind,x:x+random(-5,5),y:y+random(-4,4),age:0});}
  function emitConstruction(site,count=2){const y=siteGroundY(site)-buildings[site.kind].h*.38;
    for(let i=0;i<count;i++)constructionParticles.push({x:site.x+random(-27,27),y:y+random(-18,15),vx:random(-55,55),vy:random(-95,-20),life:random(.45,1)});
  }
  function celebrateCraft(name,site){craftResult=`✦ ${name} 제작 완료!`;craftResultClock=2.8;emitConstruction(site,28);site.completeFlash=.8;
    damageFloats.push({x:site.x,y:siteGroundY(site)-45,text:`✦ ${name}`,life:1.3,color:'#f7dfa0'});
  }
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
  function siteFootprint(site){const half=buildings[site.kind].w*.31,row=Math.floor((siteGroundY(site)-ORIGIN)/TILE);
    return {left:Math.floor((site.x-half)/TILE),right:Math.floor((site.x+half)/TILE),row};}
  function supportsStructure(c,r){return s.sites.some(site=>{const f=siteFootprint(site);return r===f.row&&c>=f.left&&c<=f.right;})||
    s.chests.some(chest=>r===Math.floor(((chest.y??groundY(chest.x))-ORIGIN)/TILE)&&c>=Math.floor((chest.x-34*.31)/TILE)&&c<=Math.floor((chest.x+34*.31)/TILE));}
  function reconcileUnsupported(){const fallen=s.sites.filter(site=>{const f=siteFootprint(site);for(let c=f.left;c<=f.right;c++)if(!tileAt(c,f.row))return true;return false;});
    if(fallen.length){s.sites=s.sites.filter(site=>!fallen.includes(site));s.pendingBedOffers=s.pendingBedOffers.filter(id=>!fallen.some(a=>a.id===id));}
    const brokenChests=s.chests.filter(chest=>{const r=Math.floor(((chest.y??groundY(chest.x))-ORIGIN)/TILE);
      for(let c=Math.floor((chest.x-34*.31)/TILE);c<=Math.floor((chest.x+34*.31)/TILE);c++)if(!tileAt(c,r))return true;return false;});
    if(brokenChests.length){s.chests=s.chests.filter(chest=>!brokenChests.includes(chest));if(openChest&&brokenChests.includes(openChest)){openChest=null;hideModal();}}
    const count=fallen.length+brokenChests.length;if(count){flash(`받침 블록이 없어 설치물 ${count}개가 무너졌어요`);save(true);}return count;
  }
  function walkableFoot(x,currentFoot){const c=Math.floor(x/TILE);
    if(c<0||c>=COLS)return null;
    const currentRow=Math.floor((currentFoot-ORIGIN)/TILE);
    for(let r=Math.max(2,currentRow-2);r<ROWS;r++){
      if(!tileAt(c,r)||tileAt(c,r-1)||tileAt(c,r-2))continue;
      const nextFoot=ORIGIN+r*TILE;
      if(nextFoot<currentFoot-2*TILE-1)return null;
      if(nextFoot>currentFoot+2&&[currentFoot-6,currentFoot-26].some(y=>tileAt(c,Math.floor((y-ORIGIN)/TILE))))return null;
      return nextFoot;
    }
    return null;
  }
  function moveWalker(actor,destination,speed,gameDt){actor.footY??=groundY(actor.x);actor.drawY??=actor.footY;
    const direction=Math.sign(destination-actor.x),distance=Math.min(Math.abs(destination-actor.x),speed*gameDt);
    if(!direction||!distance){const standing=walkableFoot(actor.x,actor.footY);if(standing!==null)actor.footY=standing;
      actor.drawY+=clamp(actor.footY-actor.drawY,-195*gameDt,220*gameDt);return;}
    const segments=Math.max(1,Math.ceil(distance/4)),step=direction*distance/segments;let climbing=false;
    for(let i=0;i<segments;i++){
      const nextX=actor.x+step,front=nextX+direction*7,foot=walkableFoot(front,actor.footY);
      if(foot===null)break;
      if(foot<actor.footY-1){actor.drawY=Math.max(foot,actor.drawY-195*gameDt);
        if(actor.drawY>foot+1){climbing=true;break;}
      }
      actor.x=nextX;actor.footY=foot;
    }
    if(!climbing)actor.drawY+=clamp(actor.footY-actor.drawY,-195*gameDt,220*gameDt);
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
    const p=s.player,down=s.settings.controlMode==='keyboard'?keyboard.down:joystick.y>.37,up=s.settings.controlMode==='keyboard'?keyboard.up:joystick.y<-.55;
    const choices=down?[[p.x,p.y+33],[p.x+p.facing*23,p.y+35]]:
      up?[[p.x,p.y-13],[p.x+p.facing*23,p.y+2]]:
      [[p.x+p.facing*23,p.y+12],[p.x+p.facing*23,p.y+25],[p.x,p.y+33]];
    for(const [x,y] of choices){let c=Math.floor(x/TILE),r=Math.floor((y-ORIGIN)/TILE);
      if(tileAt(c,r)&&inReach(c,r))return {c,r};}
    return null;
  }
  const blockHp=type=>type===1?3:type===5?4:type===2?6:type===3||type===6?8:type===7?10:9;
  function dig(c,r){if(c<0||c>=COLS||r<0||r>=ROWS)return false;const type=tileAt(c,r);if(!type||!inReach(c,r))return false;
    if(supportsStructure(c,r)){flash('건물이나 상자를 받치는 블록은 캘 수 없어요 · 건물 철거를 이용하세요');return true;}
    const key=`${c},${r}`;s.damage ||= {};
    const power=s.equipped.tool==='ironPickaxe'?3:['pickaxe','copperPickaxe'].includes(s.equipped.tool)?2:1;
    s.damage[key]=power+(s.damage[key]||0);
    hitTile={c,r};hitClock=.24;const hp=blockHp(type);
    if(s.damage[key]>=hp){
      if(s.placedBlocks[key])delete s.placedBlocks[key];else if(r>=0)s.terrain[r][c]=0;
      delete s.damage[key];delete s.enemyDamage[key];const gain=type===1?'dirt':type===3?'metal':type===4?'crystal':type===5?'wood':type===6?'copper':type===7?'iron':'stone';
      dropItem(gain,c*TILE+TILE/2,ORIGIN+r*TILE+TILE/2);s.stats.blocksMined++;checkAwards();flash(`${names[gain]} 드롭 · 가까이 가서 줍기`);targetTile=null;
    }
    else flash('광물을 캐는 중…');
    return true;
  }
  function collect(resource){resource.hp--;const k=resource.type;
    dropItem(k,resource.x,groundY(resource.x)-17);
    flash(`${names[k]} 드롭 · 가까이 가서 줍기`);
    if(resource.hp<=0){s.resources.splice(s.resources.indexOf(resource),1);setTimeout(addResource,3500);}
  }
  function beginBlock(kind){if(!s.inv[kind]){flash(`${names[kind]}이 부족해요`);return;}
    mode=`place:${kind}`;hideModal();flash(`${names[kind]} 설치: 가까운 빈 칸을 터치하세요`);}
  function placeBlock(c,r,kind,underfoot=false){
    if(c<0||c>=COLS||r<0||r>=ROWS||!inReach(c,r)){flash('캐릭터 가까운 칸을 선택하세요');return;}
    if(tileAt(c,r)){flash('이미 블록이 있는 칸이에요');return;}
    const p=s.player,x=c*TILE,y=ORIGIN+r*TILE;
    if(x<p.x+8&&x+TILE>p.x-8&&y<p.y+24&&y+TILE>p.y){flash('캐릭터가 있는 곳에는 설치할 수 없어요');return;}
    if(!underfoot&&![[c-1,r],[c+1,r],[c,r-1],[c,r+1]].some(([a,b])=>tileAt(a,b))){flash('다른 블록에 붙여 설치하세요');return;}
    if(!s.inv[kind]){mode=null;flash(`${names[kind]}이 부족해요`);return;}
    s.placedBlocks[`${c},${r}`]=blockTypes[kind];delete s.enemyDamage[`${c},${r}`];s.inv[kind]--;
    if(!s.inv[kind])mode=null;
    flash(`${names[kind]} 블록 설치 완료${withinOutpost(x+TILE/2,y+TILE/2)?'':' · 전초기지 밖: 다음 날 파괴'}`);
  }
  function placeBelow(){const selected=mode?.startsWith('place:')?mode.slice(6):s.hotbar[s.hotbarSlot];
    if(!blockTypes[selected]){flash('핫바에서 돌·흙·나무 블록을 선택하세요');return;}
    const c=Math.floor(s.player.x/TILE),r=Math.ceil((s.player.y+24-ORIGIN)/TILE);
    if(tileAt(c,r)){flash('발밑에 이미 블록이 있어요');return;}
    placeBlock(c,r,selected,true);
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
  function gather(){
    const p=s.player;
    const resource=s.resources.filter(a=>Math.abs(a.x-p.x)<48&&Math.abs((p.y+24)-groundY(a.x))<65).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
    if(resource){collect(resource);return;}
    flash('채집할 자원 가까이 이동하세요');
  }
  function mine(){
    const site=s.sites.filter(a=>!a.done&&nearSite(a,85)).sort((a,b)=>Math.abs(a.x-s.player.x)-Math.abs(b.x-s.player.x))[0];
    if(site){if(supplied(site)){site.progress+=.6;emitConstruction(site,7);flash(`${buildings[site.kind].name} 건설 중…`);}else deliver(site,true);return;}
    const tile=selectDigTile();if(tile&&dig(tile.c,tile.r))return;
    flash('캐낼 블록 가까이 이동하세요');
  }
  function damageEnemy(enemy,amount){const dealt=Math.min(enemy.hp,amount);enemy.hp-=amount;enemy.hitFlash=.18;
    damageFloats.push({x:enemy.x+random(-7,7),y:(enemy.drawY??groundY(enemy.x))-36,text:`-${dealt}`,life:.85,color:'#ffdd9b'});
    if(enemy.hp<=0){s.enemies.splice(s.enemies.indexOf(enemy),1);s.kills++;if(Math.random()<.35){dropItem('food',enemy.x,(enemy.footY??groundY(enemy.x))-17);flash('식량 드롭');}}}
  function blockInEnemyPath(enemy,direction){let closest=null,dist=Infinity;
    const center=Math.floor(enemy.x/TILE);
    for(let c=center-2;c<=center+2;c++){
      if(c<0||c>=COLS)continue;
      const row=Math.floor(((enemy.footY??groundY(enemy.x))-ORIGIN)/TILE);
      for(let r=Math.max(0,row-3);r<=Math.min(ROWS-1,row+1);r++){
        const key=`${c},${r}`;if(!s.placedBlocks[key]||ORIGIN+r*TILE>=(enemy.footY??groundY(enemy.x))-2)continue;
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
  function attackInterval(){return s.equipped.weapon==='spear'?.62:s.equipped.weapon==='sword'?.36:.46;}
  function attack(){if(attackCooldown>0)return;attackCooldown=attackInterval();attackFlash=.16;
    const p=s.player,reach=s.equipped.weapon==='spear'?116:77;
    const enemy=s.enemies.filter(e=>Math.abs(e.x-p.x)<reach&&Math.abs(((e.footY??groundY(e.x))-25)-(p.y+14))<74).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
    if(enemy)damageEnemy(enemy,s.equipped.weapon==='sword'?30:s.equipped.weapon==='spear'?25:18);else flash('공격 범위에 적이 없어요');}
  function flatFoundation(x,width,clickedY){const left=Math.floor((x-width*.31)/TILE),right=Math.floor((x+width*.31)/TILE);
    if(left<0||right>=COLS)return null;
    const base=Math.floor((groundY(x)-ORIGIN)/TILE),candidates=[];
    for(let r=Math.max(1,base-4);r<Math.min(ROWS,base+6);r++){
      let level=true;for(let c=left;c<=right;c++)if(!tileAt(c,r)||tileAt(c,r-1)){level=false;break;}
      if(level)candidates.push(ORIGIN+r*TILE);
    }
    return candidates.sort((a,b)=>Math.abs(a-clickedY)-Math.abs(b-clickedY))[0]??null;
  }
  function build(x,kind,clickedY=groundY(x)){if(Math.abs(s.player.y+24-clickedY)>95){flash('캐릭터 가까운 평탄한 지면을 선택하세요');return;}
    const info=buildings[kind];x=clamp(x,50,WORLD_W-50);
    if(!['drafting','outpost'].includes(kind)&&!(s.blueprints[kind]>0)){flash('설계도 작업대에서 먼저 설계도를 만드세요');return;}
    if(Math.abs(s.player.x-x)>190){flash('가까운 지면에 설계도를 놓으세요');return;}
    const floor=flatFoundation(x,info.w,clickedY);
    if(floor===null||Math.abs(floor-clickedY)>65||Math.abs(floor-(s.player.y+24))>95){flash('블록을 평탄하게 만들고 그 지면을 터치하세요');return;}
    if(s.sites.some(a=>Math.abs(a.x-x)<(buildings[a.kind].w+info.w)*.31+11&&Math.abs(siteGroundY(a)-floor)<55)){flash('건물 사이의 간격이 부족해요');return;}
    s.sites.push({id:s.nextSiteId++,x,y:floor,kind,put:{},progress:0,done:false});
    if(!['drafting','outpost'].includes(kind))s.blueprints[kind]--;
    mode=null;previewX=null;previewY=null;
    flash(`${info.name} 설계도 설치! 채집으로 재료를 넣으세요${kind!=='outpost'&&!withinOutpost(x,floor)?' · 전초기지 밖은 다음 날 파괴':''}`);
  }
  function createPlan(kind){
    if(!draftingReady()){flash('완성된 설계도 작업대 가까이 이동하세요');return;}
    if(!canPay(plans[kind].cost)){flash('설계도 재료가 부족해요');return;}
    pay(plans[kind].cost);s.blueprints[kind]=(s.blueprints[kind]||0)+1;
    celebrateCraft(`${buildings[kind].name} 설계도`,s.sites.find(a=>a.kind==='drafting'&&a.done&&nearSite(a,135)));
    flash(`${buildings[kind].name} 설계도 +1`);showDrafting();
  }
  function craft(kind){const recipe=crafts[kind];if(!recipe)return;
    if(toolCrafts.has(kind)?!toolbenchReady():!workshopReady()){flash(`완성된 ${toolCrafts.has(kind)?'도구 제작대':'제작소'} 가까이에서 제작하세요`);return;}
    if(!canPay(recipe.cost)){flash('제작 재료가 부족해요');return;}
    pay(recipe.cost);
    if(gear[kind]){s.ownedGear[kind]=true;s.gearCount[kind]=(s.gearCount[kind]||0)+1;}
    else s.inv[kind]+=kind==='ladder'?4:1;
    celebrateCraft(recipe.name,s.sites.find(a=>a.kind===(toolCrafts.has(kind)?'toolbench':'workshop')&&a.done&&nearSite(a,135)));
    flash(`${recipe.name} 제작 완료 · ${gear[kind]?'장비':'가방'}에서 확인하세요`);showCraft();
  }
  function beginChest(){if(!s.inv.chest){flash('상자가 없어요. 제작소에서 만드세요');return;}mode='chest';hideModal();flash('지상의 평평한 땅을 터치해 상자를 놓으세요');}
  function placeChest(x,clickedY=groundY(x)){const center=(Math.floor(x/TILE)+.5)*TILE,y=flatFoundation(center,34,clickedY);
    if(y===null||Math.abs(center-s.player.x)>155||Math.abs(y-(s.player.y+24))>75||Math.abs(y-clickedY)>65){flash('캐릭터 가까운 평평한 지면을 선택하세요');return;}
    if(s.chests.some(a=>Math.abs(a.x-center)<54&&Math.abs((a.y??groundY(a.x))-y)<40)||s.sites.some(a=>Math.abs(a.x-center)<(buildings[a.kind].w*.31+25)&&Math.abs(siteGroundY(a)-y)<50)){flash('상자를 놓을 평평한 빈 자리가 필요해요');return;}
    if(!s.inv.chest)return;
    s.inv.chest--;s.chests.push({x:center,y,contents:{}});mode=null;flash(`상자 설치 완료${withinOutpost(center,y)?'':' · 전초기지 밖: 다음 날 파괴'}`);save(true);
  }
  const storageKeys=['stone','dirt','wood','metal','copper','iron','fiber','crystal','food','medkit','ladder'];
  let openChest=null;
  function showChest(chest){if(!s.chests.includes(chest)||Math.abs(s.player.x-chest.x)>110||Math.abs(s.player.y+24-(chest.y??groundY(chest.x)))>80){flash('상자 가까이에서 열 수 있어요');return;}
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
  const outpostsWithBeds=()=>s.sites.filter(a=>a.kind==='outpost'&&a.done&&s.sites.some(b=>b.kind==='bed'&&b.done&&Math.abs(b.x-a.x)<=18*TILE&&Math.abs(siteGroundY(b)-siteGroundY(a))<=18*TILE));
  const eligibleBeds=()=>s.sites.filter(b=>b.kind==='bed'&&b.done&&outpostsWithBeds().some(a=>Math.abs(b.x-a.x)<=18*TILE&&Math.abs(siteGroundY(b)-siteGroundY(a))<=18*TILE));
  function assignLegacyBeds(){const available=eligibleBeds().filter(b=>!s.allies.some(a=>a.bedId===b.id));
    for(const ally of s.allies)if(!ally.bedId&&available.length){const bed=available.shift();ally.bedId=bed.id;
      const home=outpostsWithBeds().find(a=>Math.abs(bed.x-a.x)<=18*TILE&&Math.abs(siteGroundY(bed)-siteGroundY(a))<=18*TILE);ally.homeX=home?.x??ally.homeX;}}
  function scheduleBedOffers(){assignLegacyBeds();for(const bed of eligibleBeds())
    if(bed.completedDay<s.day&&!s.pendingBedOffers.includes(bed.id)&&!s.allies.some(a=>a.bedId===bed.id))s.pendingBedOffers.push(bed.id);
    s.pendingBedOffers=s.pendingBedOffers.filter(id=>eligibleBeds().some(a=>a.id===id));}
  function chooseAlly(bedId,role){const bed=eligibleBeds().find(a=>a.id===bedId),ranges={combat:[80,120],farmer:[40,80],builder:[40,80]};
    if(!bed||!ranges[role]||!s.pendingBedOffers.includes(bedId)||s.allies.some(a=>a.bedId===bedId))return;
    const home=outpostsWithBeds().find(a=>Math.abs(bed.x-a.x)<=18*TILE&&Math.abs(siteGroundY(bed)-siteGroundY(a))<=18*TILE);
    if(!home)return;
    const [min,max]=ranges[role],maxHp=Math.floor(random(min,max+1));
    s.allies.push({id:s.nextAllyId++,bedId,homeX:home.x,x:bed.x,footY:siteGroundY(bed),drawY:siteGroundY(bed),role,work:0,maxHp,hp:maxHp,equipment:{}});
    s.pendingBedOffers=s.pendingBedOffers.filter(id=>id!==bedId);save(true);flash(`${roleName[role]} 동료 합류 · 체력 ${maxHp}`);showAllies();
  }
  function freeGearCount(id){const worn=Object.values(s.equipped).filter(v=>v===id).length+s.allies.reduce((n,a)=>n+Object.values(a.equipment||{}).filter(v=>v===id).length,0);
    return Math.max(0,(s.gearCount[id]||0)-worn);}
  function refreshBagIfOpen(){if($('overlay').classList.contains('open')&&$('modal-title').textContent==='🎒 가방')showBag();}
  function useMedkit(){if(!s.inv.medkit||s.hp>=100){flash('회복약이 없거나 체력이 가득 찼어요');return;}s.inv.medkit--;s.hp=Math.min(100,s.hp+35);flash('체력 35 회복');refreshBagIfOpen();}
  function eatFood(){if(s.food<=0||s.hunger>=100){flash('식량이 없거나 허기가 가득 찼어요');return;}s.food--;s.hunger=Math.min(100,s.hunger+30);flash('식량을 먹어 허기 30 회복');refreshBagIfOpen();}
  function respawn(isDeath=false){const p=s.player;
    if(isDeath)s.food=Math.max(0,s.food-2);
    s.hp=100;s.hunger=Math.max(isDeath?60:70,s.hunger);s.temperature=36.5;s.tempClock=0;s.lastBiome='meadow';
    deathClock=isDeath?1.1:.45;hurtClock=0;
    p.x=SPAWN_X;p.y=groundY(SPAWN_X)-24;p.vy=0;p.facing=1;
    s.enemies=s.enemies.filter(e=>Math.abs(e.x-SPAWN_X)>220);
    mode=null;targetTile=null;previewX=null;previewY=null;held.mine=false;held.attack=false;
    viewX=p.x-logicalW*.5;viewY=p.y+12-logicalH*.5;
    hideModal();save(true);flash(isDeath?'쓰러져서 시작 지점에서 부활했어요':'시작 지점 X 0 · Y 0으로 리스폰했어요');
  }
  function beginLadder(){if(!s.inv.ladder){flash('사다리가 없어요');return;}mode='ladder';hideModal();flash('근처 지하 빈 칸을 터치해 사다리를 설치하세요');}
  function placeLadder(c,r){if(c<0||c>=COLS||r<surfaceRows[c]||r>=ROWS||tileAt(c,r)||!inReach(c,r)){flash('가까운 지하 빈 칸을 터치하세요');return;}
    if(s.ladders.some(a=>a.c===c&&a.r===r)){flash('이미 사다리가 있어요');return;}
    s.ladders.push({c,r});s.inv.ladder--;mode=s.inv.ladder?'ladder':null;flash(`사다리 설치 완료${withinOutpost((c+.5)*TILE,ORIGIN+(r+.5)*TILE)?'':' · 전초기지 밖: 다음 날 파괴'}`);}

  function showModal(title,html){$('modal-title').textContent=title;$('modal-body').innerHTML=html;$('overlay').classList.add('open');}
  function hideModal(){$('overlay').classList.remove('open');}
  const slotNames={helmet:'헬멧',armor:'갑옷',legs:'바지',boots:'신발',tool:'곡괭이',weapon:'무기',light:'등불'};
  const slotIcons={helmet:'◕',armor:'▣',legs:'▥',boots:'◧',tool:'⛏',weapon:'⚔',light:'✧'};
  const itemIcons={stone:'▧',dirt:'▦',wood:'▥',metal:'⬡',copper:'◆',iron:'⬢',fiber:'❀',crystal:'✦',food:'◉',medkit:'⚕',ladder:'╫',chest:'▣',basicSword:'⚔',sword:'⚔',spear:'♠',basicPickaxe:'⛏',pickaxe:'⛏',copperPickaxe:'⛏',ironPickaxe:'⛏',armor:'▣',helmet:'◕',leggings:'▥',boots:'◧',lamp:'✧'};
  const bagItems=['stone','dirt','wood','metal','copper','iron','fiber','crystal','food','medkit','ladder','chest'];
  function bagCount(id){return gear[id]?Number(!!s.ownedGear[id]):id==='food'?s.food:(s.inv[id]||0);}
  let hotbarSnapshot='';
  function renderHotbar(){const signature=s.hotbarSlot+'|'+s.hotbar.map(id=>`${id}:${bagCount(id)}`).join('|');if(signature===hotbarSnapshot)return;hotbarSnapshot=signature;
    const bar=$('hotbar');bar.innerHTML=s.hotbar.map((id,i)=>`<button class="hotbar-slot ${s.hotbarSlot===i?'selected':''}" data-hotbar="${i}" aria-label="${i+1}번 ${names[id]} ${bagCount(id)}개" title="${names[id]} · ${bagCount(id)}개"><span>${itemIcons[id]}</span><small>${bagCount(id)||''}</small></button>`).join('');}
  function useHotbar(){const id=s.hotbar[s.hotbarSlot];if(!bagCount(id)){flash(`${names[id]}이 없어요`);return;}
    if(id==='food')eatFood();else if(id==='medkit')useMedkit();else if(id==='ladder')beginLadder();else if(id==='chest')beginChest();
    else if(blockTypes[id])beginBlock(id);else flash(`${names[id]}은 제작과 건설에 사용하는 재료예요`);
  }
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
      <button data-pin="${id}" class="pin-hotbar">${s.hotbarSlot+1}번 핫바에 넣기</button>
      <p class="hint">돌·흙·나무를 고르고 블록 설치를 누르면 가까운 빈 칸에 놓을 수 있어요.</p>`);}
  function showEquipment(){showModal('⚔ 장비',`<p class="section-note">가방과 별도로 무기·곡괭이·방어구를 장착합니다. 공격속도 ${(1/attackInterval()).toFixed(1)}회/초</p>
    <div class="equipment-layout"><div class="body-slots">${['helmet','armor','legs','boots'].map(slot=>`<div class="equip-slot"><span class="equip-icon">${slotIcons[slot]}</span><span>${slotNames[slot]}<b>${gear[s.equipped[slot]]?.name||'빈 칸'}</b></span></div>`).join('')}</div><div class="hand-slots">${['tool','weapon','light'].map(slot=>`<div class="equip-slot"><span class="equip-icon">${slotIcons[slot]}</span><span>${slotNames[slot]}<b>${gear[s.equipped[slot]]?.name||'빈 칸'}</b></span></div>`).join('')}</div></div>
    <h3>보유한 장비</h3>${Object.entries(gear).filter(([id])=>s.gearCount[id]>0).map(([id,g])=>`<div class="recipe"><div><b>${itemIcons[id]} ${g.name}</b><small>${g.detail} · 총 ${s.gearCount[id]}개 · 남은 ${freeGearCount(id)}개</small></div><button data-equip="${id}" ${s.equipped[g.slot]===id||!freeGearCount(id)?'disabled':''}>${s.equipped[g.slot]===id?'장착 중':freeGearCount(id)?'장착':'다른 동료 사용 중'}</button></div>`).join('')}
    <p class="hint">동료별 장비는 동료 메뉴에서 지정합니다. 장비는 도구 제작대에서 여러 벌 제작할 수 있어요.</p>`);}
  function showDrafting(){const ready=draftingReady(),exists=s.sites.some(a=>a.kind==='drafting'&&a.done);
    showModal('⌑ 설계도 제작',`<p class="hint">${ready?'작업대에서 설계도를 만들 수 있어요.':exists?'완성된 설계도 작업대 가까이 이동하세요.':'먼저 설계도 창에서 설계도 작업대를 설치하고 재료를 넣어 완성하세요.'}</p>
      ${ready&&craftResultClock>0?`<div class="craft-result">${craftResult}</div>`:''}
      ${ready?Object.entries(plans).map(([kind,p])=>`<div class="recipe"><div><b>${buildings[kind].icon} ${buildings[kind].name} 설계도</b><small>재료: ${costText(p.cost)} · 가방 ${s.blueprints[kind]||0}개</small></div><button data-plan="${kind}" ${!canPay(p.cost)?'disabled':''}>제작</button></div>`).join(''):''}
      ${!exists?'<button data-build="drafting">설계도 작업대 설치</button>':''}`);}
  function showBuild(){const available=Object.entries(plans).filter(([kind])=>(s.blueprints[kind]||0)>0);
    const nearby=s.sites.filter(a=>Math.abs(a.x-s.player.x)<150&&Math.abs(siteGroundY(a)-(s.player.y+24))<95);
    showModal('▣ 설계도',`<p class="hint">전초기지에서 가로·세로 각각 18블록까지 정사각형 범위가 보호됩니다. 밖의 설치물은 다음 날 파괴됩니다. 전초기지는 어디서나 건설할 수 있어요.</p>
      <div class="recipe"><div><b>⚑ 전초기지</b><small>시작 설계도 · 건설 재료: ${costText(buildings.outpost.cost)}</small></div><button data-build="outpost">선택</button></div>
      <div class="recipe"><div><b>⌑ 설계도 작업대</b><small>시작 설계도 · 건설 재료: ${costText(buildings.drafting.cost)}</small></div><button data-build="drafting">선택</button></div>
      ${available.map(([kind])=>{const b=buildings[kind];return `<div class="recipe"><div><b>${b.icon} ${b.name} <span class="badge">×${s.blueprints[kind]}</span></b><small>건설 재료: ${costText(b.cost)}</small></div><button data-build="${kind}">선택</button></div>`;}).join('')}
      ${!available.length?'<p class="section-note">제작한 다른 설계도가 아직 없어요.</p>':''}
      <h3>주변 건물 관리 · 다음 날 철거</h3>${nearby.length?nearby.map(a=>`<div class="recipe"><div><b>${buildings[a.kind].icon} ${buildings[a.kind].name}</b><small>${a.demolishDay?`${a.demolishDay}일차 철거 예약`:'터치해서 철거 예약 또는 취소'}</small></div><button data-manage-site="${a.id}">관리</button></div>`).join(''):'<p class="section-note">건물 가까이 가거나 건물을 직접 터치해 관리하세요.</p>'}`);}
  function showSiteManagement(site){if(!s.sites.includes(site))return;
    showModal(`${buildings[site.kind].icon} ${buildings[site.kind].name}`,`<p class="hint">${site.done?'건설 완료':'건설 중'} · 건물은 바닥 블록이 없어지면 무너집니다.</p>
      ${site.demolishDay?`<p class="section-note">${site.demolishDay}일차 아침에 철거 예정</p><button data-undo-demolish="${site.id}">철거 취소</button>`:
      `<button data-demolish="${site.id}">다음 날 철거하기</button>`}`);}
  function showCraft(){const ready=workshopReady(),toolReady=toolbenchReady();
    const rows=(isTool)=>Object.entries(crafts).filter(([key])=>toolCrafts.has(key)===isTool).map(([key,r])=>{
      return `<div class="recipe"><div><b>${r.name}</b><small>${r.description}${gear[key]?` · 보유 ${s.gearCount[key]||0}개`:''}<br>${costText(r.cost)}</small></div><button data-craft="${key}" ${!(isTool?toolReady:ready)||!canPay(r.cost)?'disabled':''}>제작</button></div>`;}).join('');
    showModal('⚙ 아이템 제작',`${craftResultClock>0&&(ready||toolReady)?`<div class="craft-result">${craftResult}</div>`:''}
      ${!ready&&!toolReady?'<p class="hint">완성된 제작소나 도구 제작대 가까이 가면 만들 수 있는 아이템이 나타나요.</p>':''}
      ${toolReady?`<h3>⚒ 도구 제작대</h3>${rows(true)}`:''}
      ${ready?`<h3>⚙ 제작소</h3>${rows(false)}`:''}`);}
  function showSettings(){showModal('⚙ 설정',`<div class="settings-row"><div><b>조작 방식</b><br><span class="section-note">키보드 또는 화면 조이스틱 선택</span></div><select data-control-mode aria-label="조작 방식"><option value="joystick" ${s.settings.controlMode==='joystick'?'selected':''}>조이스틱</option><option value="keyboard" ${s.settings.controlMode==='keyboard'?'selected':''}>키보드</option></select></div>
    <p class="hint">키보드: A/D 좌우 이동 · W 사다리 · S+E 아래 블록 캐기 · 스페이스 점프 · E 장착 도구 사용/건설 · G 자원 채집 · F 공격 · I 가방 · 숫자 1~8 핫바. 키보드 선택 시 화면 조이스틱과 전투 버튼이 숨겨집니다.</p><div class="settings-row"><div><b>조이스틱 크기</b><br><span class="section-note">작게 ← → 크게 · 최대 200</span></div><input type="range" min="80" max="200" step="4" data-setting="joystick" value="${s.settings.joystickSize}" aria-label="조이스틱 크기"><span id="size-value">${s.settings.joystickSize}</span></div>
    <p class="hint">크기 설정은 자동으로 저장됩니다. 작은 화면에서는 버튼과 겹치지 않도록 크기가 조절됩니다.</p><div class="settings-row"><span>현재 진행 상황</span><button data-save="1">저장</button></div>
    <div class="settings-row"><div><b>리스폰 · 시작 지점으로</b><br><span class="section-note">X 0 · Y 0으로 이동하고 체력이 회복됩니다. 가방·건물·진행 상황은 유지됩니다.</span></div><button data-respawn="1">리스폰</button></div>`);}
  const roleName={combat:'전투',farmer:'농부',builder:'건설'};
  function showAllies(){const offers=s.pendingBedOffers.filter(id=>eligibleBeds().some(a=>a.id===id));
    showModal('✦ 동료',`<p class="hint">침대가 완성된 다음 날 동료의 역할을 고릅니다. 각 동료는 매일 식량 10개를 먹고, 식량이 부족하면 떠납니다.</p>
    <p class="section-note">동료 ${s.allies.length}명 · 전초기지 안의 침대 ${eligibleBeds().length}개 · 매일 필요한 식량 ${s.allies.length*10}개</p>
    ${offers.map((id,i)=>`<div class="ally-offer"><b>✦ 새 동료 ${i+1} · 역할 선택</b><div class="ally-choices"><button data-choose-ally="${id}:combat">⚔ 전투<small>체력 80~120 · 적 공격</small></button><button data-choose-ally="${id}:farmer">✿ 농부<small>체력 40~80 · 농사</small></button><button data-choose-ally="${id}:builder">⌑ 건설<small>체력 40~80 · 자재 운반</small></button></div></div>`).join('')}
    ${s.allies.map((a,i)=>`<div class="recipe"><div><b>${i+1}번 동료 · ${roleName[a.role]||'건설'} · ♥${Math.ceil(a.hp)}/${a.maxHp}</b><small>장비 ${Object.values(a.equipment||{}).filter(Boolean).length}개 · 전초기지 30블록 이내</small></div><button data-ally-gear="${i}">장비</button></div>`).join('')}`);}
  function showAllyEquipment(index){const ally=s.allies[index];if(!ally)return;ally.equipment||={};
    showModal(`⚔ ${index+1}번 동료 장비`,`<p class="hint">${roleName[ally.role]} · 체력 ${Math.ceil(ally.hp)}/${ally.maxHp} · 장비 한 벌은 한 명만 사용할 수 있어요.</p>
      <div class="equipment-layout"><div class="body-slots">${['helmet','armor','legs','boots'].map(slot=>`<div class="equip-slot"><span class="equip-icon">${slotIcons[slot]}</span><span>${slotNames[slot]}<b>${gear[ally.equipment[slot]]?.name||'빈 칸'}</b></span></div>`).join('')}</div>
      <div class="hand-slots">${['tool','weapon','light'].map(slot=>`<div class="equip-slot"><span class="equip-icon">${slotIcons[slot]}</span><span>${slotNames[slot]}<b>${gear[ally.equipment[slot]]?.name||'빈 칸'}</b></span></div>`).join('')}</div></div>
      <h3>장착할 장비</h3>${Object.entries(gear).filter(([id])=>s.gearCount[id]>0).map(([id,g])=>`<div class="recipe"><div><b>${itemIcons[id]} ${g.name}</b><small>${slotNames[g.slot]} · 사용 가능 ${freeGearCount(id)}개</small></div><button data-ally-equip="${index}:${id}" ${ally.equipment[g.slot]===id||!freeGearCount(id)?'disabled':''}>${ally.equipment[g.slot]===id?'장착 중':freeGearCount(id)?'장착':'사용 중'}</button></div>`).join('')}
      <h3>장비 벗기</h3>${Object.entries(ally.equipment).filter(([,id])=>!!id).map(([slot,id])=>`<button class="unequip-button" data-ally-unequip="${index}:${slot}">${slotIcons[slot]} ${gear[id]?.name||id} 벗기</button>`).join('')||'<p class="section-note">장착한 장비가 없어요.</p>'}
      <button class="ally-back" data-ally-back="1">← 동료 목록</button>`);}
  $('modal-body').addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.build){mode=b.dataset.build;hideModal();flash(`${buildings[mode].name} 설계도: 지상의 빈 곳을 터치하세요`);}
    if(b.dataset.plan)createPlan(b.dataset.plan);
    if(b.dataset.craft)craft(b.dataset.craft);
    if(b.dataset.manageSite){const site=s.sites.find(a=>a.id===Number(b.dataset.manageSite));if(site)showSiteManagement(site);}
    if(b.dataset.chooseAlly){const [id,role]=b.dataset.chooseAlly.split(':');chooseAlly(Number(id),role);}
    if(b.dataset.allyGear!==undefined)showAllyEquipment(Number(b.dataset.allyGear));
    if(b.dataset.allyBack)showAllies();
    if(b.dataset.allyEquip){const [indexText,id]=b.dataset.allyEquip.split(':'),index=Number(indexText),ally=s.allies[index],slot=gear[id]?.slot;
      if(ally&&slot&&freeGearCount(id)>0){ally.equipment[slot]=id;save(true);showAllyEquipment(index);flash(`${gear[id].name} 장착`);}}
    if(b.dataset.allyUnequip){const [indexText,slot]=b.dataset.allyUnequip.split(':'),index=Number(indexText),ally=s.allies[index];
      if(ally?.equipment?.[slot]){delete ally.equipment[slot];save(true);showAllyEquipment(index);flash('장비를 벗었어요');}}
    if(b.dataset.demolish){const site=s.sites.find(a=>a.id===Number(b.dataset.demolish));if(site){site.demolishDay=s.day+1;save(true);showSiteManagement(site);flash(`${buildings[site.kind].name}: 다음 날 철거 예약`);}}
    if(b.dataset.undoDemolish){const site=s.sites.find(a=>a.id===Number(b.dataset.undoDemolish));if(site){delete site.demolishDay;save(true);showSiteManagement(site);flash('철거 예약을 취소했어요');}}
    if(b.dataset.select){s.selectedItem=b.dataset.select;showBag();}
    if(b.dataset.pin){s.hotbar[s.hotbarSlot]=b.dataset.pin;renderHotbar();save(true);flash(`${names[b.dataset.pin]}을 ${s.hotbarSlot+1}번 핫바에 넣었어요`);showBag();}
    if(b.dataset.equip&&s.ownedGear[b.dataset.equip]&&freeGearCount(b.dataset.equip)>0){const g=gear[b.dataset.equip];s.equipped[g.slot]=b.dataset.equip;save(true);showEquipment();flash(`${g.name} 장착 완료`);}
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
  });
  $('modal-body').addEventListener('input',e=>{if(e.target.dataset.setting!=='joystick')return;
    s.settings.joystickSize=clamp(Number(e.target.value),80,200);
    document.documentElement.style.setProperty('--joy-size',`${s.settings.joystickSize}px`);
    $('size-value').textContent=s.settings.joystickSize;save(true);
  });
  $('modal-body').addEventListener('change',e=>{if(!e.target.matches('[data-control-mode]'))return;
    s.settings.controlMode=e.target.value==='keyboard'?'keyboard':'joystick';
    keyboard.left=keyboard.right=keyboard.down=keyboard.up=keyboard.mine=keyboard.gather=keyboard.attack=false;
    joystick.x=joystick.y=0;stick.style.transform='translate(0,0)';
    document.body.classList.toggle('keyboard-controls',s.settings.controlMode==='keyboard');save(true);
  });
  $('close').onclick=hideModal;$('overlay').addEventListener('pointerdown',e=>{if(e.target===$('overlay'))hideModal();});
  $('bag').onclick=showBag;$('equipment').onclick=showEquipment;$('awards').onclick=showAwards;$('drafting').onclick=showDrafting;$('build').onclick=showBuild;$('craft').onclick=showCraft;$('allies').onclick=showAllies;$('settings').onclick=showSettings;
  $('hotbar').addEventListener('click',e=>{const slot=e.target.closest('[data-hotbar]');if(!slot)return;const i=Number(slot.dataset.hotbar);
    if(i===s.hotbarSlot)useHotbar();else{s.hotbarSlot=i;flash(`${names[s.hotbar[i]]} 선택 · 다시 누르면 사용`);}renderHotbar();});
  document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(b&&!b.disabled)b.classList.add('pressed');});
  for(const type of ['pointerup','pointercancel'])document.addEventListener(type,()=>document.querySelectorAll('button.pressed').forEach(b=>b.classList.remove('pressed')));
  $('cancel-mode').onclick=()=>{mode=null;previewX=null;previewY=null;flash('선택을 취소했어요');};
  $('speed').onclick=()=>{speed=speed===1?10:1;$('speed').textContent=`×${speed}`;flash(`시간 속도 ×${speed}`);};
  document.documentElement.style.setProperty('--joy-size',`${clamp(s.settings.joystickSize,80,200)}px`);
  document.body.classList.toggle('keyboard-controls',s.settings.controlMode==='keyboard');
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
  holdButton('gather','gather',()=>{gatherCooldown=.28;gather();});
  holdButton('attack','attack',attack);
  $('place-below').addEventListener('pointerdown',e=>{e.preventDefault();placeBelow();});
  $('jump').addEventListener('pointerdown',e=>{e.preventDefault();jump();});
  const keyboard={left:false,right:false,down:false,up:false,mine:false,gather:false,attack:false};
  addEventListener('keydown',e=>{if(s.settings.controlMode!=='keyboard'||$('overlay').classList.contains('open'))return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();
    if(['a','ArrowLeft'].includes(e.key))keyboard.left=true;
    if(['d','ArrowRight'].includes(e.key))keyboard.right=true;
    if(['s','ArrowDown'].includes(e.key))keyboard.down=true;
    if(['w','ArrowUp'].includes(e.key))keyboard.up=true;
    if(e.code==='Space'&&!e.repeat){e.preventDefault();jump();}
    if(e.key.toLowerCase()==='e')keyboard.mine=true;
    if(e.key.toLowerCase()==='g')keyboard.gather=true;
    if(e.key.toLowerCase()==='f')keyboard.attack=true;
    if(e.key.toLowerCase()==='i'&&!e.repeat)showBag();
    if(/^[1-8]$/.test(e.key)&&!e.repeat){s.hotbarSlot=Number(e.key)-1;renderHotbar();}});
  addEventListener('keyup',e=>{if(['a','ArrowLeft'].includes(e.key))keyboard.left=false;
    if(['d','ArrowRight'].includes(e.key))keyboard.right=false;
    if(['s','ArrowDown'].includes(e.key))keyboard.down=false;
    if(['w','ArrowUp'].includes(e.key))keyboard.up=false;
    if(e.key.toLowerCase()==='e')keyboard.mine=false;
    if(e.key.toLowerCase()==='g')keyboard.gather=false;
    if(e.key.toLowerCase()==='f')keyboard.attack=false;});
  addEventListener('blur',()=>{for(const key of Object.keys(keyboard))keyboard[key]=false;});
  function eventWorld(e){const bounds=canvas.getBoundingClientRect();return {x:(e.clientX-bounds.left)*logicalW/bounds.width+viewX,y:(e.clientY-bounds.top)*logicalH/bounds.height+viewY};}
  canvas.addEventListener('pointermove',e=>{if(mode&&mode!=='ladder'){const p=eventWorld(e);previewX=p.x;previewY=p.y;}});
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();const p=eventWorld(e),c=Math.floor(p.x/TILE),r=Math.floor((p.y-ORIGIN)/TILE);
    if(mode==='chest'){placeChest(p.x,p.y);return;}
    if(mode==='ladder'){placeLadder(c,r);return;}
    if(mode?.startsWith('place:')){placeBlock(c,r,mode.slice(6));return;}
    if(mode&&buildings[mode]){build(p.x,mode,p.y);return;}
    const chest=s.chests.find(a=>Math.abs(a.x-p.x)<23&&p.y>=(a.y??groundY(a.x))-38&&p.y<=(a.y??groundY(a.x))+6);
    if(chest){showChest(chest);return;}
    const site=s.sites.find(a=>Math.abs(a.x-p.x)<buildings[a.kind].w*.32&&p.y>=siteGroundY(a)-buildings[a.kind].h*.7&&p.y<=siteGroundY(a)+7);
    if(site){if(Math.abs(site.x-s.player.x)<150&&Math.abs(siteGroundY(site)-(s.player.y+24))<95)showSiteManagement(site);else flash('건물 가까이에서 터치하세요');return;}
    if(c>=0&&c<COLS&&r>=0&&r<ROWS&&tileAt(c,r)&&inReach(c,r)){targetTile={c,r};flash('선택한 블록을 도구 버튼이나 E키로 파세요');}
    else targetTile=null;
  });

  function clearOutsideOutposts(){let removed=0;
    const sites=s.sites.filter(a=>a.kind==='outpost'||withinOutpost(a.x,siteGroundY(a)));removed+=s.sites.length-sites.length;s.sites=sites;
    for(const key of Object.keys(s.placedBlocks)){const [c,r]=key.split(',').map(Number);
      if(!withinOutpost((c+.5)*TILE,ORIGIN+(r+.5)*TILE)){delete s.placedBlocks[key];delete s.enemyDamage[key];delete s.damage?.[key];removed++;}}
    const ladders=s.ladders.filter(a=>withinOutpost((a.c+.5)*TILE,ORIGIN+(a.r+.5)*TILE));removed+=s.ladders.length-ladders.length;s.ladders=ladders;
    const chests=s.chests.filter(a=>withinOutpost(a.x,a.y??groundY(a.x)));removed+=s.chests.length-chests.length;s.chests=chests;
    if(openChest&&!s.chests.includes(openChest)){openChest=null;hideModal();}
    return removed+reconcileUnsupported();
  }

  function processDemolitions(){const scheduled=s.sites.filter(a=>a.demolishDay&&a.demolishDay<=s.day);
    if(scheduled.length){s.sites=s.sites.filter(a=>!scheduled.includes(a));s.pendingBedOffers=s.pendingBedOffers.filter(id=>!scheduled.some(a=>a.id===id));}
    return scheduled.length;
  }

  function update(dt){const p=s.player,gameDt=Math.min(dt,.05)*speed;
    let move=clamp(s.settings.controlMode==='keyboard'?(keyboard.right?1:0)-(keyboard.left?1:0):joystick.x,-1,1);
    if(Math.abs(move)<.12)move=0;if(move)p.facing=Math.sign(move);
    moveAxis(move*(s.equipped.boots==='boots'?173:154)*dt,'x');
    const ladder=s.ladders.some(a=>Math.abs((a.c+.5)*TILE-p.x)<17&&Math.abs(ORIGIN+(a.r+.5)*TILE-(p.y+12))<30);
    if(ladder&&(joystick.y<-.25||keyboard.up)){p.vy=0;moveAxis(-105*dt,'y');}
    else{p.vy=clamp(p.vy+710*dt,-380,370);if(moveAxis(p.vy*dt,'y'))p.vy=0;}
    if(held.mine||keyboard.mine){mineCooldown-=dt;if(mineCooldown<=0){mine();mineCooldown=.28;}}
    if(held.gather||keyboard.gather){gatherCooldown-=dt;if(gatherCooldown<=0){gather();gatherCooldown=.28;}}
    attackCooldown=Math.max(0,attackCooldown-dt);attackFlash=Math.max(0,attackFlash-dt);
    if((held.attack||keyboard.attack)&&attackCooldown<=0)attack();
    for(let i=s.drops.length-1;i>=0;i--){const item=s.drops[i];item.age=(item.age||0)+dt;
      if(item.age<.45)continue;
      const dx=p.x-item.x,dy=p.y+12-item.y,dist=Math.hypot(dx,dy);
      if(dist<58){const pull=Math.min(1,dt*8);item.x+=dx*pull;item.y+=dy*pull;
        if(Math.hypot(p.x-item.x,p.y+12-item.y)<18){if(item.kind==='food')s.food++;else s.inv[item.kind]=(s.inv[item.kind]||0)+1;
          if(item.kind==='wood'){s.stats.woodCollected++;checkAwards();}s.drops.splice(i,1);flash(`${names[item.kind]} +1`);}}
    }
    const prev=Math.floor(s.time/CYCLE);s.time+=gameDt;
    s.hunger=Math.max(0,s.hunger-gameDt*.035);
    painTimer=Math.max(0,painTimer-dt);hurtClock=Math.max(0,hurtClock-dt);deathClock=Math.max(0,deathClock-dt);
    const currentBiome=nearCampfire()?'campfire':biomeAt(p.x);
    if(currentBiome!==s.lastBiome){s.lastBiome=currentBiome;s.tempClock=0;}
    s.tempClock+=dt;
    while(s.tempClock>=10){s.tempClock-=10;const biome=currentBiome;
      if(biome==='campfire')s.temperature=Math.round((s.temperature+Math.sign(36.5-s.temperature)*Math.min(.3,Math.abs(36.5-s.temperature)))*10)/10;
      else if(biome==='desert')s.temperature=Math.round((s.temperature+.1)*10)/10;
      else if(biome==='tundra')s.temperature=Math.round((s.temperature-.1)*10)/10;
      else s.temperature=Math.round((s.temperature+Math.sign(36.5-s.temperature)*Math.min(.1,Math.abs(36.5-s.temperature)))*10)/10;
    }
    if(s.hunger===0)takeDamage(gameDt*.12);
    if(s.temperature>=39||s.temperature<=34)takeDamage(gameDt*.12);
    if(s.hp<=0){respawn(true);return;}
    if(Math.floor(s.time/CYCLE)>prev){s.day++;const demolished=processDemolitions(),cleared=clearOutsideOutposts();
      for(const site of s.sites)if(site.done&&site.kind==='farm')s.food+=3;
      assignLegacyBeds();const activeBeds=new Set(eligibleBeds().map(a=>a.id));let bedless=0;
      for(const ally of [...s.allies])if(ally.bedId&&!activeBeds.has(ally.bedId)){s.allies.splice(s.allies.indexOf(ally),1);bedless++;}
      scheduleBedOffers();let departed=0;
      for(const ally of [...s.allies]){if(s.food>=10)s.food-=10;else{s.allies.splice(s.allies.indexOf(ally),1);departed++;}}
      if(eligibleBeds().length)for(const ally of s.allies)ally.hp=Math.min(ally.maxHp,ally.hp+5);
      flash(`${s.day}일차 낮 · 철거 ${demolished} · 범위 밖 파괴 ${cleared} · 떠난 동료 ${departed+bedless}`);
      if(s.pendingBedOffers.length)showAllies();save(true);}
    if(phase()==='밤'&&nearSurface()){spawnCooldown-=gameDt;if(spawnCooldown<=0){spawnCooldown=clamp(13-s.day*.65,3,13);
      let center=nearSurface()?p.x:880;
      let x=Math.random()<.5?clamp(center-random(400,590),20,WORLD_W-20):clamp(center+random(400,590),20,WORLD_W-20);
      s.enemies.push({x,hp:26+s.day*4,strike:0,footY:groundY(x),drawY:groundY(x)});}}
    else spawnCooldown=0;
    // 동굴 몬스터는 플레이어가 실제 동굴의 빈 공간에 가까울 때만 나타난다.
    s.enemies=s.enemies.filter(e=>!e.cave||Math.hypot(e.x-p.x,(e.footY??0)-(p.y+24))<560);
    caveSpawnCooldown-=gameDt;
    if(caveSpawnCooldown<=0){caveSpawnCooldown=7;
      const pr=Math.floor((p.y+24-ORIGIN)/TILE),pc=Math.floor(p.x/TILE);
      if(pr>=Math.floor((SPAWN_Y-ORIGIN)/TILE)+40&&s.enemies.filter(e=>e.cave).length<5){
        const candidates=[];
        for(let c=Math.max(1,pc-11);c<=Math.min(COLS-2,pc+11);c++)for(let r=Math.max(42,pr-4);r<=Math.min(ROWS-1,pr+4);r++){
          if(Math.abs(c-pc)<3||r<surfaceRows[c]+41||!tileAt(c,r)||tileAt(c,r-1)||tileAt(c,r-2))continue;
          const x=(c+.5)*TILE,foot=ORIGIN+r*TILE;
          if(Math.hypot(x-p.x,foot-(p.y+24))<230)candidates.push({x,foot});
        }
        if(candidates.length){const spot=candidates[Math.floor(Math.random()*candidates.length)];
          s.enemies.push({x:spot.x,hp:26+s.day*4,strike:0,footY:spot.foot,drawY:spot.foot,cave:true});}
      }
    }
    for(const site of s.sites){if(site.done||!supplied(site))continue;
      const workers=s.allies.filter(a=>a.role==='builder'&&Math.abs(a.x-site.x)<80).length;
      const work=gameDt*((nearSite(site,115)?1:0)+workers*.7);site.progress+=work;
      site.sparkClock=(site.sparkClock||0)+gameDt;if(work>0&&site.sparkClock>.11){site.sparkClock=0;emitConstruction(site,4);}
      if(site.progress>=buildings[site.kind].work){site.done=true;if(site.kind==='bed')site.completedDay=s.day;site.completeFlash=1.25;emitConstruction(site,42);s.stats.buildingsBuilt++;held.mine=false;checkAwards();flash(`${buildings[site.kind].name} 완성!`);}}
    for(const site of s.sites)site.completeFlash=Math.max(0,(site.completeFlash||0)-dt);
    craftResultClock=Math.max(0,craftResultClock-dt);
    for(let i=constructionParticles.length-1;i>=0;i--){const v=constructionParticles[i];v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=145*dt;v.life-=dt;if(v.life<=0)constructionParticles.splice(i,1);}
    for(const a of s.allies){a.work=(a.work||0)-gameDt;
      const homes=outpostsWithBeds(),home=homes.find(t=>t.x===a.homeX)||homes.sort((u,v)=>Math.abs(u.x-a.x)-Math.abs(v.x-a.x))[0];
      if(home)a.homeX=home.x;
      const base=home?.x??SPAWN_X,minimum=base-30*TILE,maximum=base+30*TILE;
      if(home&&(a.x<minimum||a.x>maximum)){a.x=clamp(a.x,minimum+TILE,maximum-TILE);a.footY=groundY(a.x);a.drawY=a.footY;}
      let destination=base;
      if(home&&a.x>=minimum&&a.x<=maximum){
        if(a.role==='builder'){const site=s.sites.find(t=>!t.done&&t.x>=minimum&&t.x<=maximum);
          if(site){destination=site.x-24;if(Math.abs(a.x-site.x)<70&&a.work<=0&&!supplied(site)){deliver(site,false);a.work=2;}}}
        else if(a.role==='farmer'&&phase()==='낮'){const farm=s.sites.filter(t=>t.kind==='farm'&&t.done&&t.x>=minimum&&t.x<=maximum).sort((u,v)=>Math.abs(u.x-a.x)-Math.abs(v.x-a.x))[0];
          if(farm){destination=farm.x;if(Math.abs(a.x-farm.x)<42&&a.work<=0){s.food++;a.work=28;damageFloats.push({x:farm.x,y:siteGroundY(farm)-40,text:'식량 +1',life:.85,color:'#a9e6a4'});}}}
        else if(a.role==='combat')destination=base+(s.allies.indexOf(a)%3-1)*70;
      }
      destination=clamp(destination,minimum+10,maximum-10);
      moveWalker(a,destination,78,gameDt);
      if(a.role==='combat'){const reach=a.equipment?.weapon==='spear'?105:70;
        const enemy=s.enemies.find(e=>Math.abs(e.x-a.x)<reach&&Math.abs((e.footY??groundY(e.x))-a.footY)<60);
        if(enemy&&a.work<=0){damageEnemy(enemy,a.equipment?.weapon==='sword'?25:a.equipment?.weapon==='spear'?21:a.equipment?.weapon==='basicSword'?17:12);a.work=a.equipment?.weapon==='spear'?1.2:.85;}}
    }
    for(const enemy of [...s.enemies]){enemy.strike-=gameDt;enemy.breakClock=(enemy.breakClock||0)-gameDt;enemy.hitFlash=Math.max(0,(enemy.hitFlash||0)-dt);
      const wall=s.sites.find(a=>a.done&&a.kind==='wall'&&Math.abs(a.x-enemy.x)<33);
      const tx=wall?wall.x:(enemy.cave||nearSurface()?p.x:880);
      const direction=Math.sign(tx-enemy.x),block=blockInEnemyPath(enemy,direction);
      if(block){if(enemy.breakClock<=0){enemy.breakClock=.85;
          s.enemyDamage[block.key]=(s.enemyDamage[block.key]||0)+1;
          blockImpact={c:block.c,r:block.r,life:.2};
          if(s.enemyDamage[block.key]>=Math.max(3,blockHp(s.placedBlocks[block.key]))){
            delete s.placedBlocks[block.key];delete s.enemyDamage[block.key];delete s.damage?.[block.key];
            const collapsed=reconcileUnsupported();if(Math.abs(enemy.x-p.x)<160&&!collapsed)flash('몬스터가 설치한 블록을 부쉈어요');
          }
        }}
      else moveWalker(enemy,tx,clamp(40+s.day*2,40,87),gameDt);
      if(block)moveWalker(enemy,enemy.x,0,gameDt);
      if(Math.abs(enemy.x-p.x)<26&&Math.abs((enemy.footY??groundY(enemy.x))-p.y-28)<52&&enemy.strike<=0){
        const protection=(s.equipped.armor==='armor'?3:0)+(s.equipped.helmet==='helmet'?1:0)+(s.equipped.legs==='leggings'?1:0)+(s.equipped.boots==='boots'?1:0);
        takeDamage(Math.max(2,10-protection),true);enemy.strike=1.2;
        damageFloats.push({x:p.x,y:p.y-12,text:'피격!',life:.7,color:'#ff8e9b'});
        if(s.hp<=0){respawn(true);break;}}
      else if(enemy.strike<=0){const ally=s.allies.find(a=>Math.abs(a.x-enemy.x)<25&&Math.abs(a.footY-(enemy.footY??groundY(enemy.x)))<35);
        if(ally){const armor=(ally.equipment?.armor==='armor'?2:0)+(ally.equipment?.helmet==='helmet'?1:0)+(ally.equipment?.legs==='leggings'?1:0)+(ally.equipment?.boots==='boots'?1:0);
          const dealt=Math.max(1,6-armor);ally.hp=Math.max(0,ally.hp-dealt);enemy.strike=1.2;
          damageFloats.push({x:ally.x,y:ally.drawY-40,text:`-${dealt}`,life:.75,color:'#ff9a9a'});
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
    viewX=p.x-logicalW*.5;
    viewY=p.y+12-logicalH*.5;
  }

  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function text(str,x,y,size=12,color='#edf5ea'){ctx.font=`bold ${size}px monospace`;ctx.fillStyle=color;ctx.fillText(str,Math.round(x),Math.round(y));}
  function drawBackground(){const night=phase()==='밤';let sky=ctx.createLinearGradient(0,-120,0,490);
    sky.addColorStop(0,night?'#111c3b':'#315a77');sky.addColorStop(.62,night?'#38405e':'#7093a0');sky.addColorStop(1,night?'#54526a':'#b7adb0');
    ctx.fillStyle=sky;ctx.fillRect(-logicalW,-logicalH-100,WORLD_W+logicalW*2,WORLD_H+logicalH+100);
    const left=Math.max(0,Math.floor(viewX/TILE)-1),right=Math.min(COLS-1,Math.ceil((viewX+logicalW)/TILE)+1);
    for(let c=left;c<=right;c++){const x=c*TILE,y=groundY(x),zone=biomeAt(x);
      const blend=(edge)=>clamp((x-edge+260)/520,0,1);
      const sand=blend(3000)*(1-blend(5300)),snow=blend(7500)*(1-blend(10500));
      if(sand||snow)rect(x,-100,TILE,600,`rgba(${snow?194:219},${snow?220:164},${snow?226:126},${(snow*.19+sand*.16).toFixed(3)})`);
      // 먼 산과 지면 안개를 겹쳐 하늘과 땅의 경계를 부드럽게 만든다.
      const ridge=y-58-22*Math.sin(c*.036)-17*Math.sin(c*.011);
      rect(x,ridge,TILE,Math.max(0,y-ridge),night?'#43556a77':zone==='desert'?'#b6998066':zone==='tundra'?'#8ca9b577':'#64828b77');
      const mist=ctx.createLinearGradient(0,y-68,0,y+35);
      mist.addColorStop(0,'#b2c6b900');mist.addColorStop(.63,night?'#8696a936':'#c1d1bf55');mist.addColorStop(1,'#243b4100');
      ctx.fillStyle=mist;ctx.fillRect(x,y-68,TILE,103);
    }
    for(let i=0;i<1160;i++){const x=(i*373+83)%WORLD_W,y=11+(i*79)%280;
      if(y<groundY(x)-17)rect(x,y,i%8===0?3:2,2,night?'#c6def0':'#9cbfc8');}
    for(let i=0;i<130;i++){const zone=i%65<30?'desert':'tundra',base=(zone==='desert'?3000:7500)+(i>=65?12280:0),span=zone==='desert'?2300:3000;
      const x=base+(i*317+performance.now()*(zone==='desert'?.009:.003))%span,y=(i*79+performance.now()*.015)%280;
      if(y<groundY(x)-15)rect(x,y,zone==='desert'?4:3,zone==='desert'?1:3,zone==='desert'?'#f2d9a77d':'#e2f9efcc');}
    rect(1650,35,65,65,night?'#b6a4b7':'#d0bfa2');
    rect(1662,44,18,13,night?'#817897':'#aaa08e');
    for(let i=0;i<148;i++){const x=i*169+(i*37)%61,height=22+Math.floor(hash(i,3)*39),width=18+Math.floor(hash(i,9)*28),y=groundY(x);
      rect(x,y-height,width,height,night?'#41546888':'#667d8299');
      rect(x+5,y-height-6,width-10,7,night?'#607181aa':'#98a9a7aa');}
    for(let i=0;i<276;i++){const x=i*88+19,v=hash(i,17),biome=Math.floor(x/760)%3,y=groundY(x),zone=biomeAt(x);
      if(zone==='desert'){rect(x-2,y-27,9,27,'#4b8772');rect(x-8,y-20,7,5,'#6bac83');rect(x-8,y-23,3,9,'#4b8772');rect(x+5,y-15,8,5,'#6bac83');rect(x+10,y-19,3,9,'#4b8772');continue;}
      if(zone==='tundra'){rect(x+1,y-37,5,37,'#536c72');rect(x-18,y-26,40,12,'#527b80');rect(x-13,y-41,30,13,'#6b969b');rect(x-7,y-54,18,16,'#a8ced1');rect(x-19,y-28,38,4,'#e1ecdd');continue;}
      if(v>.55){const height=43+Math.floor(v*50),width=23+Math.floor(hash(i,8)*25);
        rect(x+width/2-3,y-height+13,6,height-13,biome===1?'#536c75':'#536e66');
        rect(x,y-height,width,15,biome===1?'#758bb2':biome===2?'#a1749f':'#81ac9c');
        rect(x+6,y-height-8,width-12,10,biome===1?'#acb4d0':biome===2?'#c89fbb':'#abcfc0');
        rect(x+8,y-height+7,3,3,'#e5d9b6');}
      else{rect(x+2,y-20,5,20,'#507e6e');rect(x-5,y-27,21,12,biome===2?'#a780ad':'#81b99d');}}
    for(const x0 of [316,1280,2040,3310,4860,5600,7120,8360,10320,11480])for(const x of [x0,x0+12280]){const y=groundY(x);
      rect(x-16,y-35,33,35,'#637d8c');rect(x-9,y-63,20,30,'#85b8bd');
      rect(x-3,y-89,8,28,'#a2e1d4');rect(x+6,y-42,14,16,'#709caf');}
    for(const x0 of [600,1770,3890,5280,6940,8550,10560])for(const x of [x0,x0+12280]){const y=groundY(x);
      rect(x-31,y-67,12,67,'#677b85');rect(x+20,y-67,12,67,'#677b85');
      rect(x-30,y-76,62,12,'#8fa1a1');rect(x-4,y-92,9,16,'#a2c3b8');}
  }
  function drawTerrain(){const left=Math.max(0,Math.floor(viewX/TILE)-1),right=Math.min(COLS-1,Math.ceil((viewX+logicalW)/TILE)+1);
    const top=Math.max(0,Math.floor((viewY-ORIGIN)/TILE)-1),bottom=Math.min(ROWS-1,Math.ceil((viewY+logicalH-ORIGIN)/TILE)+1);
    for(let r=top;r<=bottom;r++)for(let c=left;c<=right;c++){
      const type=tileAt(c,r),shake=(hitClock>0&&hitTile?.c===c&&hitTile?.r===r)||(blockImpact?.life>0&&blockImpact.c===c&&blockImpact.r===r),x=c*TILE+(shake?Math.round(Math.sin(performance.now()/20)*2):0),y=ORIGIN+r*TILE,noise=hash(c,r);
      // 지표면에서 판 빈 칸에는 하늘과 지면 안개를 비춘다. 깊은 곳으로 갈수록 동굴 배경이 된다.
      if(type===0){const depth=r-surfaceRows[c];
        if(depth>=0){const darkness=Math.min(1,(depth+.5)/8);
          rect(c*TILE,y,TILE,TILE,`rgba(26,43,56,${darkness.toFixed(3)})`);}
        continue;}
      const biome=Math.floor(c*TILE/760)%3,zone=biomeAt(c*TILE);
      // 지상에서 보이는 광맥은 암석 표면으로 가린다. 지하에서는 주변만 드러난다.
      const visibleOre=type>=3&&type!==5&&s.player.y>=groundY(s.player.x)+TILE*.5&&
        Math.hypot(x+TILE/2-s.player.x,y+TILE/2-(s.player.y+12))<155;
      const drawnType=(type===3||type===4||type===6||type===7)&&!visibleOre?2:type;
      const colors={1:zone==='desert'?'#ad8459':zone==='tundra'?'#596f79':r===surfaceRows[c]?['#695c53','#70605b','#745962'][biome]:'#68564f',2:zone==='desert'?'#7d6858':zone==='tundra'?'#50687b':['#44566a','#4a5b70','#504c66'][biome],3:'#4d6275',4:'#4b536c',5:'#806857',6:'#946d54',7:'#637683'};
      rect(x,y,TILE,TILE,colors[drawnType]);
      rect(x+2,y+2,13+noise*6,2,drawnType===1?'#a18170':drawnType===5?'#ae906c':'#617488');
      if(noise>.32)rect(x+4+(noise*5|0),y+15,7+noise*4,2,'#34475a');
      else{rect(x+5,y+10,3,3,'#647888');rect(x+15,y+17,3,2,'#334a5a');}
      if(type===1&&r===surfaceRows[c]&&!s.placedBlocks[`${c},${r}`]){rect(x,y,TILE,5,zone==='desert'?'#dfbc80':zone==='tundra'?'#cbe4e1':'#7fa88e');rect(x+7,y-3,4,4,zone==='desert'?'#efd9ac':zone==='tundra'?'#effbfa':'#a9c3a0');}
      if(type===5){rect(x+5,y+4,2,13,'#a58768');rect(x+14,y+4,2,13,'#a58768');}
      if(drawnType===3){rect(x+4,y+5,6,7,'#78b2bd');rect(x+13,y+12,5,5,'#9bd0cf');}
      if(drawnType===6){rect(x+4,y+5,7,7,'#dd9862');rect(x+13,y+12,5,4,'#f2b27a');}
      if(drawnType===7){rect(x+5,y+4,7,8,'#a5c7cc');rect(x+13,y+12,5,5,'#d2e1d8');}
      if(drawnType===4){rect(x+6,y+3,7,14,'#a88fd2');rect(x+11,y+7,6,10,'#c9b9ed');}
      const dmg=s.damage?.[`${c},${r}`];if(dmg){rect(x+3,y+11,12,2,'#1d2c40');rect(x+13,y+7,2,14,'#1d2c40');}
      const enemyDmg=s.enemyDamage[`${c},${r}`];if(enemyDmg){rect(x+3,y+5,13,2,'#e48a79');rect(x+8,y+6,2,11,'#ac544c');}
    }
    for(const a of s.ladders){let x=a.c*TILE+3,y=ORIGIN+a.r*TILE;
      rect(x,y,3,TILE,'#c5a570');rect(x+11,y,3,TILE,'#c5a570');for(let j=0;j<3;j++)rect(x,y+4+j*6,14,2,'#dfc08c');}
  }
  function drawSurfaceMist(){const left=Math.max(0,Math.floor(viewX/TILE)-1),right=Math.min(COLS-1,Math.ceil((viewX+logicalW)/TILE)+1);
    for(let c=left;c<=right;c++){const x=c*TILE,y=groundY(x),zone=biomeAt(x);
      const mist=ctx.createLinearGradient(0,y-23,0,y+19);
      mist.addColorStop(0,'#c0d2cd00');mist.addColorStop(.52,zone==='desert'?'#e2cca12b':zone==='tundra'?'#c8e2e841':'#a5c5b839');mist.addColorStop(1,'#8fa5ad00');
      ctx.fillStyle=mist;ctx.fillRect(x,y-23,TILE,42);
    }}
  function drawResources(){for(const a of s.resources){let x=a.x,y=groundY(a.x);
    if(a.type==='fiber'){rect(x-3,y-28,6,28,'#699280');rect(x-12,y-36,24,15,'#a6c8a0');rect(x+4,y-45,7,16,'#7bb5a0');}
    else if(a.type==='food'){rect(x-3,y-21,6,21,'#557e69');rect(x-12,y-32,24,14,'#6ba780');rect(x-8,y-27,5,5,'#ef9b9e');rect(x+4,y-25,5,5,'#ef9b9e');}
    else if(a.type==='wood'&&biomeAt(x)==='desert'){rect(x-6,y-62,12,62,'#6a876a');rect(x-20,y-46,16,9,'#83ad78');rect(x-19,y-53,7,20,'#5d8d68');rect(x+5,y-35,16,9,'#83ad78');rect(x+15,y-44,7,17,'#5d8d68');}
    else if(a.type==='wood'){rect(x-7,y-58,14,58,'#80604d');rect(x-4,y-55,4,49,'#af896b');rect(x-16,y-57,12,5,'#826752');
      rect(x-24,y-80,48,20,'#547d70');rect(x-19,y-98,38,24,'#79a28a');rect(x-12,y-110,26,16,'#9ac2a1');
      rect(x-20,y-78,8,8,'#aad1a4');rect(x+10,y-85,10,10,'#a1c99a');if(biomeAt(x)==='tundra')rect(x-19,y-99,40,5,'#e1f2eb');}
    else{rect(x-13,y-20,26,20,'#70869a');rect(x-6,y-29,14,13,a.type==='metal'?'#8bd0d5':'#b8a3b8');rect(x+4,y-12,5,5,'#d2e0dc');}}
  }
  function drawDrops(){for(const a of s.drops){if(a.x<viewX-25||a.x>viewX+logicalW+25||a.y<viewY-25||a.y>viewY+logicalH+25)continue;
    const float=Math.sin(performance.now()/190+a.x)*2.5;
    rect(a.x-8,a.y-7+float,16,15,'#192b3dcc');rect(a.x-6,a.y-6+float,12,11,'#567681');
    text(itemIcons[a.kind]||'✦',a.x-6,a.y+3+float,12,a.kind==='food'?'#f2b687':'#f5dca3');
  }}
  function drawChests(){for(const chest of s.chests){const x=chest.x,y=chest.y??groundY(x);
    rect(x-17,y-25,34,25,'#77533b');rect(x-19,y-30,38,8,'#aa8051');
    rect(x-17,y-8,34,4,'#a17045');rect(x-3,y-25,6,13,'#e6c382');rect(x-2,y-20,4,5,'#5b483d');
    if(Math.abs(s.player.x-x)<100&&Math.abs(s.player.y+24-y)<75)text('터치해서 열기',x-28,y-37,9,'#ffe6ad');
  }}
  function drawSites(){for(const a of s.sites){const info=buildings[a.kind];ctx.save();ctx.translate(a.x,siteGroundY(a));ctx.scale(.6,.6);const x=-info.w/2,y=-info.h;
    if(a.kind==='outpost'&&a.done){const radius=18*TILE/.6;ctx.strokeStyle='#a3e3d55a';ctx.lineWidth=2;ctx.setLineDash([9,11]);ctx.strokeRect(-radius,-radius,radius*2,radius*2);ctx.setLineDash([]);}
    if(!a.done){ctx.globalAlpha=.5;rect(x,y,info.w,info.h,'#72dad9');ctx.globalAlpha=1;
      ctx.strokeStyle='#c5f6e9';ctx.setLineDash([5,4]);ctx.strokeRect(x,y,info.w,info.h);ctx.setLineDash([]);
      const count=Object.entries(info.cost).reduce((n,[k,v])=>n+Math.min(v,a.put[k]||0),0),total=Object.values(info.cost).reduce((u,v)=>u+v,0);
      rect(x,y-12,info.w,6,'#18283b');rect(x,y-12,info.w*(count/total),6,'#e4c17c');
      text(`${info.name} ${count}/${total}`,x,y-19,11);
    }else if(a.kind==='outpost'){rect(x+7,y+34,info.w-14,info.h-34,'#475e6a');rect(x+2,y+27,info.w-4,10,'#93b7ae');
      rect(x+42,y-9,7,40,'#d0b88e');rect(x+49,y-9,30,18,'#e8c77f');rect(x+52,y-4,16,3,'#765c56');}
    else if(a.kind==='campfire'){rect(x+3,y+25,info.w-6,10,'#6f7172');rect(x+8,y+20,info.w-16,8,'#6e503d');
      const flicker=Math.sin(performance.now()/115+a.x)*3;rect(x+15,y+7+flicker,14,19-flicker,'#ed8d4d');rect(x+19,y+11+flicker,6,13-flicker,'#ffdb83');
      const glow=ctx.createRadialGradient(0,-16,4,0,-16,80);glow.addColorStop(0,'#ffb75a36');glow.addColorStop(1,'#ffb75a00');ctx.fillStyle=glow;ctx.fillRect(-80,-96,160,160);}
    else if(a.kind==='drafting'){rect(x,y+24,info.w,info.h-24,'#675e67');rect(x+8,y+17,info.w-16,12,'#bd9d7a');
      rect(x+19,y+7,48,13,'#d7c6a3');rect(x+26,y+10,25,2,'#758493');rect(x+13,y+46,16,12,'#91bdc4');}
    else if(a.kind==='workshop'){rect(x,y+18,info.w,info.h-18,'#4e6574');rect(x+5,y+5,info.w-10,19,'#92b9b1');
      rect(x+10,y+31,29,26,'#243c52');rect(x+47,y+34,31,19,'#deba80');rect(x+55,y+40,15,6,'#7bbec0');text('⚙',x+34,y+15,17,'#dcecc4');}
    else if(a.kind==='toolbench'){rect(x,y+23,info.w,info.h-23,'#605952');rect(x+5,y+15,info.w-10,13,'#b49b78');
      rect(x+12,y+30,15,20,'#45717b');rect(x+52,y+29,16,21,'#527789');rect(x+30,y+9,23,7,'#aac6c4');text('⚒',x+36,y+9,16,'#e7deaa');}
    else if(a.kind==='bed'){rect(x,y+17,info.w,info.h-17,'#657889');rect(x+5,y+11,info.w-10,17,'#caa883');rect(x+7,y+13,16,10,'#dee2cc');}
    else if(a.kind==='farm'){rect(x,y+23,info.w,25,'#70605c');for(let j=0;j<6;j++){rect(x+j*16+8,y+9,4,17,'#70b992');rect(x+j*16+4,y+5,11,7,'#addd92');}}
    else{rect(x,y,info.w,info.h,'#718792');for(let j=0;j<3;j++)rect(x+6,y+9+j*27,20,15,'#9eafb1');}
    if(a.completeFlash>0){const pulse=a.completeFlash;
      ctx.strokeStyle=`rgba(255,224,149,${Math.min(1,pulse)})`;ctx.lineWidth=4;ctx.strokeRect(x-11*pulse,y-11*pulse,info.w+22*pulse,info.h+22*pulse);
      ctx.strokeStyle=`rgba(141,233,216,${Math.min(.55,pulse*.55)})`;ctx.lineWidth=2;ctx.strokeRect(x-25*pulse,y-25*pulse,info.w+50*pulse,info.h+50*pulse);
      rect(x+info.w/2-3,y-24*pulse,6,8,'#ffe9a7');}
    if(a.demolishDay)text(`철거 ${a.demolishDay}일`,x,y-25,12,'#ffad9f');
    if(a.kind!=='outpost'&&!withinOutpost(a.x,siteGroundY(a)))text('⚠',x+info.w-13,y+11,17,'#ff9d84');ctx.restore();}
  }
  function drawConstructionParticles(){for(const v of constructionParticles){ctx.globalAlpha=Math.min(1,v.life*1.8);rect(v.x,v.y,4,4,v.vy<0?'#f4dd9c':'#a7e3d6');ctx.globalAlpha=1;}}
  function drawActors(){for(const a of s.allies){const y=a.drawY??groundY(a.x);rect(a.x-8,y-29,16,29,'#cfaa86');rect(a.x-8,y-36,16,10,'#8dc9c0');rect(a.x-5,y-24,10,5,a.equipment?.armor?'#637c91':'#355266');text(a.role==='combat'?'⚔':a.role==='farmer'?'✿':'▣',a.x-7,y-42,12);
      if(a.equipment?.helmet)rect(a.x-9,y-37,18,6,'#c4ac87');if(a.equipment?.weapon)rect(a.x+8,y-21,3,19,'#d4b683');
      rect(a.x-19,y-51,38,5,'#1b303b');rect(a.x-19,y-51,38*a.hp/a.maxHp,5,'#e57e84');text(`♥${Math.ceil(a.hp)}/${a.maxHp}`,a.x-21,y-55,10,'#ffe1d9');}
    for(const e of s.enemies){let x=e.x,y=e.drawY??groundY(x);rect(x-13,y-23,26,23,e.hitFlash>0?'#eebbbb':'#a35b88');rect(x-8,y-31,16,12,e.hitFlash>0?'#ffe3cb':'#bf78a3');rect(x-7,y-18,4,4,'#ffe1a6');rect(x+4,y-18,4,4,'#ffe1a6');rect(x-14,y-38,28,3,'#2f2437');rect(x-14,y-38,28*e.hp/(26+s.day*4),3,'#ec7892');}
    const p=s.player,x=p.x,y=p.y;
    rect(x-7,y+6,14,16,'#ceac91');rect(x-8,y,16,10,'#d9c2a6');rect(x-7,y+10,14,8,'#478399');rect(x-4,y+12,8,4,'#1c3a51');rect(x+p.facing*3,y+4,3,3,'#233249');
    rect(x-8,y+21,6,3,'#334258');rect(x+2,y+21,6,3,'#334258');
    for(const effect of damageFloats){ctx.globalAlpha=Math.min(1,effect.life*2);ctx.font='bold 17px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#251b28';ctx.strokeText(effect.text,effect.x,effect.y);ctx.fillStyle=effect.color;ctx.fillText(effect.text,effect.x,effect.y);ctx.globalAlpha=1;}ctx.textAlign='start';
    const aimed=selectDigTile();if(aimed&&aimed.c>=0&&aimed.c<COLS&&aimed.r>=0&&aimed.r<ROWS){
      const tx=aimed.c*TILE,ty=ORIGIN+aimed.r*TILE,key=`${aimed.c},${aimed.r}`,progress=(s.damage?.[key]||0)/blockHp(tileAt(aimed.c,aimed.r));
      ctx.strokeStyle='rgba(180,239,228,.38)';ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,y+15);ctx.lineTo(tx+TILE/2,ty+TILE/2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=`rgba(122,231,219,${.18+.08*Math.sin(performance.now()/170)})`;ctx.fillRect(tx+1,ty+1,TILE-2,TILE-2);
      const marked=targetTile?.c===aimed.c&&targetTile?.r===aimed.r;
      ctx.strokeStyle=marked?'#e2c682':'#75bdb2';ctx.lineWidth=2;ctx.beginPath();
      for(const [ox,oy,sx,sy] of [[0,0,1,1],[TILE,0,-1,1],[0,TILE,1,-1],[TILE,TILE,-1,-1]]){
        ctx.moveTo(tx+ox+sx*5,ty+oy);ctx.lineTo(tx+ox,ty+oy);ctx.lineTo(tx+ox,ty+oy+sy*5);
      }ctx.stroke();
      rect(tx,ty-7,TILE,4,'#102533');rect(tx,ty-7,Math.max(0,TILE*Math.min(1,progress)),4,'#f8ce80');
      if(hitClock>0&&hitTile?.c===aimed.c&&hitTile?.r===aimed.r){for(let i=0;i<4;i++){const angle=i*1.57+hitClock*8;rect(tx+12+Math.cos(angle)*19,ty+12+Math.sin(angle)*19,3,3,'#f5d6a0');}}
    }
    if(mode&&buildings[mode]&&previewX!==null){const b=buildings[mode],floor=flatFoundation(previewX,b.w,previewY??groundY(previewX))??groundY(previewX);ctx.globalAlpha=.45;rect(previewX-b.w*.3,floor-b.h*.6,b.w*.6,b.h*.6,'#88e3dc');ctx.globalAlpha=1;}
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
    for(const site of s.sites){m.fillStyle=site.done?'#f4ce8f':'#96d6d8';m.fillRect(site.x/WORLD_W*w-1,14+(siteGroundY(site)-ORIGIN)/TILE*yScale-3,3,3);}
    for(const chest of s.chests){m.fillStyle='#e6ac66';m.fillRect(chest.x/WORLD_W*w-1,14+((chest.y??groundY(chest.x))-ORIGIN)/TILE*yScale-3,3,3);}
    const px=s.player.x/WORLD_W*w,py=16+(s.player.y-ORIGIN)/TILE*yScale;
    m.strokeStyle='#ffffffaa';m.strokeRect(viewX/WORLD_W*w,Math.max(0,16+(viewY-ORIGIN)/TILE*yScale),(logicalW/WORLD_W)*w,(logicalH/TILE)*yScale);
    m.fillStyle='#0a1c29';m.fillRect(px-3,py-3,7,7);m.fillStyle='#fff0ac';m.fillRect(px-2,py-2,5,5);
  }
  function draw(){ctx.setTransform(scale,0,0,scale,0,0);ctx.fillStyle='#142134';ctx.fillRect(0,0,logicalW,logicalH);
    ctx.save();ctx.translate(-viewX,-viewY);drawBackground();drawTerrain();drawSurfaceMist();drawResources();drawDrops();drawSites();drawConstructionParticles();drawChests();drawActors();ctx.restore();
    drawDarkness();if(phase()==='밤')rect(0,0,logicalW,logicalH,'#10112b22');
    if(hurtClock>0){rect(0,0,logicalW,logicalH,`rgba(199,40,64,${hurtClock*.26})`);
      ctx.strokeStyle=`rgba(255,117,130,${hurtClock})`;ctx.lineWidth=12;ctx.strokeRect(6,6,logicalW-12,logicalH-12);}
    if(deathClock>0)rect(0,0,logicalW,logicalH,`rgba(228,236,247,${Math.min(.65,deathClock*.48)})`);
    drawMinimap();
  }
  function updateHud(){const rem=phase()==='낮'?DAY-s.time%CYCLE:CYCLE-s.time%CYCLE;
    $('clock').textContent=`${phase()==='낮'?'☀ 낮':'☾ 밤'} ${s.day}일차 · ${Math.floor(rem/60)}:${String(Math.floor(rem%60)).padStart(2,'0')} · ♥${Math.ceil(s.hp)}`;
    $('materials').textContent=`돌 ${s.inv.stone}  구리 ${s.inv.copper}  철 ${s.inv.iron}  나무 ${s.inv.wood}  식량 ${s.food}  하루 필요 ${s.allies.length*10}  동료 ${s.allies.length}`;
    $('daily-food').textContent=`🍞 매일 필요한 식량 ${s.allies.length*10}개 · 보유 ${s.food}개`;
    $('daily-food').classList.toggle('shortage',s.food<s.allies.length*10);
    $('health-value').textContent=`${Math.ceil(s.hp)}/100`;$('health-fill').style.width=`${clamp(s.hp,0,100)}%`;
    $('hunger-value').textContent=`${Math.ceil(s.hunger)}/100`;$('hunger-fill').style.width=`${clamp(s.hunger,0,100)}%`;
    $('hunger-fill').classList.toggle('low',s.hunger<25);
    $('coordinates').textContent=`⌖ X ${Math.floor((s.player.x-SPAWN_X)/TILE)} · Y ${Math.round((SPAWN_Y-s.player.y-24)/TILE)}`;
    const biome=biomeAt(s.player.x),temp=$('temperature-panel');
    temp.textContent=`${nearCampfire()?'♨ 모닥불 · ':''}${biome==='desert'?'☀':biome==='tundra'?'❄':'🌿'} ${biomeNames[biome]} · 체온 ${s.temperature.toFixed(1)}℃`;
    temp.classList.toggle('hot',biome==='desert');temp.classList.toggle('cold',biome==='tundra');
    $('awards').textContent=`🏆 ${Object.keys(s.awards).length}`;
    $('attack').style.setProperty('--cooldown',`${Math.round(100*attackCooldown/attackInterval())}%`);
    $('attack-speed').textContent=`${(1/attackInterval()).toFixed(1)}/초`;
    renderHotbar();
    const site=s.sites.find(a=>!a.done&&nearSite(a,90));
    $('status').textContent=site?`${buildings[site.kind].name}: ${Object.entries(buildings[site.kind].cost).map(([k,n])=>`${names[k]} ${site.put[k]||0}/${n}`).join(' · ')}${supplied(site)?' · 건설 중':' · 채집으로 넣기'}`:
      mode==='chest'?'평평한 지면을 터치해 상자 설치':mode==='ladder'?'빈 지하 칸을 터치해 사다리 설치':mode?.startsWith('place:')?`${names[mode.slice(6)]} 설치: 가까운 빈 칸 터치`:
      mode&&buildings[mode]?`${buildings[mode].name} 설계도: 지면 터치`:
      s.player.y>groundY(s.player.x)?'지하 탐험 · 캐낸 아이템에 접근해 줍기':
      !s.sites.some(a=>a.kind==='outpost'&&a.done)?'전초기지를 완성하면 가로·세로 18블록 안의 설치물이 유지돼요':
      withinOutpost(s.player.x,groundY(s.player.x))?'전초기지 보호 범위 · 설계도 작업대에서 모닥불 설계도 제작':'전초기지 밖 · 설치물은 다음 날 파괴돼요';
    $('cancel-mode').style.display=mode?'block':'none';
  }
  function loop(now){const dt=Math.min((now-last)/1000,.06);last=now;update(dt);draw();updateHud();requestAnimationFrame(loop);}
  reconcileUnsupported();
  requestAnimationFrame(loop);
})();
