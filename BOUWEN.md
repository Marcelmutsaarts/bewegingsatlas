# Een halte bouwen voor De Bewegingsatlas

Elke 3D-halte van de vleugel Anatomie gebruikt dezelfde motor: `atlas3d.js` met `atlas3d.css`. De motor levert de schil en alle bediening. Een halte levert alleen haar 3D-scènes en haar inhoud. De kwaliteitslat is **`spier.html` (halte 8)**: een zoomreis door vijf schaalniveaus, met rijke procedurele 3D, live feedback en een uitlegfilm. `spier.html` zelf gebruikt de motor (nog) niet, maar de motor is eruit afgeleid. Lees `spier.html` om de lat te zien.

## Wat de motor al doet

- De kop met terug-link, titel en de drie standen (toetsen 1, 2, 3), plus de knoppen Film, Geluid en Presenteren.
- De zoomladder links met de knoppen + en −, een lensovergang met schaal, en een eigen achtergrond en mist per niveau.
- Lagen aan en uit per niveau (`layers`).
- Genummerde punten in 3D met een paneel van vier tabjes, Vorige/Volgende en focus: de rest wordt doorzichtig (`focus`). Klik je op het model, dan opent het punt (`pick`).
- De speurtocht: aanwijzen in 3D met A–D, meerkeuze met uitleg per fout antwoord (`why`) en een open vraag met modelantwoord. De voortgang blijft bewaard.
- De HUD met schaal, balkjes of stappen, een bijschrift en een eigen bedieningsrij (`ctl`). In stand 3 verschijnen automatisch de knoppen Opnieuw en, met `grades:true`, Graad 1–3.
- Knoppen voor Pauze, Slow motion (¼×) en Camerarit, en toetsen voor alles.
- Gegenereerd geluid, presentatiestand, uitlegvenster met sneltoetsen, labels Stippen/Namen/Uit en beeldkwaliteit Mooi/Snel.
- De uitlegfilm: hoofdstukken, Nederlandse stem, ondertitels, filmbalken, titelkaarten, stappenkaartjes, muziek en video-export.
- Deeplinks: `#5` (punt), `#niveau=2`, `#stand=3`, `#speurtocht`, `#film`.
- Mobiele layout, safe areas, reduced motion en foutschermen.
- Testhaak: `window.__atlas`.

## Het skelet van een halte

```html
<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Heup en bekken · Bewegingsatlas</title>
<meta name="description" content="…">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="atlas3d.css">
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js"></script>
<script src="atlas3d.js"></script>
<script>
Atlas3D({ /* cfg, zie hieronder */ });
</script>
</body>
</html>
```

Je mag in `<head>` een eigen `<style>` zetten voor kleine extra's, zoals een tagkleur of een HUD-onderdeel. Pas `atlas3d.js` en `atlas3d.css` niet aan. Ontbreekt er iets in de motor, los het dan op in je eigen halte en noem het in je verslag.

## cfg

```js
Atlas3D({
  id:'heup', halte:7, name:'Heup en bekken',            // name verschijnt in het venstertabblad en op de film
  docTitle:'Heup en bekken · Bewegingsatlas',
  aria:'3D-zoomreis door de heup',
  loader:['Het bekken wordt opgebouwd…','Van sprint tot kraakbeen'],
  seed:7,                                               // voor K.R(), zodat elke halte haar eigen toeval heeft
  shadow:{left:-13,right:13,top:13,bottom:-6},          // schaduwcamera van niveau 0 (optioneel)
  levels:[                                              // 3 tot 5 schaalniveaus, van groot naar klein
    {name:'Heup', scale:'20 cm', sc:'GEWRICHT', title:'Heup en bekken', sub:'<i>Articulatio coxae</i> · bij de sprint',
     view:[[11,7,15],[0,3,0]],          // camerapositie en doel
     zoomTo:[1.2,3.4,.6],               // punt waar de camera naartoe duikt bij inzoomen (weglaten op het laatste niveau)
     s1:'Rust', s2:'Sprint', s3:'Vermoeid',  // namen van de standen op dit niveau
     bg:['#2c3a42','#18232a','#0d1316'],     // achtergrond: midden, tussen, rand
     fog:0x17222a, hemi:.6, shadows:true, drone:false},
    …
  ],
  help:{title:'Zo werkt de zoomreis', html:'<p>…</p><ul>…</ul><h3>Drie standen</h3><p>…</p>', states:'Rust · sprint · vermoeid', keys:[['<kbd>S</kbd>','Eén stap verder']]},
  film:{brand:'HEUP EN BEKKEN', blurb:'Hoe de heup je sprint draagt · ca. 3 minuten · met stem en ondertitels', file:'heup-uitleg'},
  quizEnd:'<p>Bespreek de slotvraag met je groep. Probeer daarna in de gymzaal …</p>',
  build(K){ … return {levels, points, tags, quiz, layers, film:{scenes}}; }
});
```

## build(K) en wat je teruggeeft

De motor maakt per niveau een lege groep, `K.groups[i]` (onzichtbaar tot dat niveau actief is). Bouw je scène in die groep. Geef daarna een object terug:

```js
return {
  levels:[ handler0, handler1, … ],   // één per niveau, zie hieronder
  points:[ … ], tags:[ … ], quiz:[ … ], layers:[ … ],
  film:{ scenes:[ … ], stop(){ /* filmtoestand opruimen */ } },
};
```

**Een handler per niveau:**

```js
{
  step(dt){ … },          // elk frame. dt is 0 bij pauze en ¼ bij slow motion. Gebruik K.S.state, K.S.stT (tijd in deze stand) en K.S.clock.
  reset(n,isCurrent){ … },// bij elke standwissel (ook bij niveauwissel), voor ELK niveau. Zet hier de dynamische toestand terug.
  hud(){ return K.bars(['Heuphoek','Activatie','Belasting']); },   // of K.stepsHTML([...]), of eigen html
  ctl(){ return '<label>Tempo</label><input type="range" id="sT" min=".25" max="2" step=".05" value="1" aria-label="Tempo">'; },
  bind(){ /* listeners op je ctl-elementen */ },
  grades:true,            // in stand 3 de knoppen Graad 1–3 tonen (K.S.grade)
  replay:true,            // in stand 3 de knop Opnieuw tonen (standaard aan)
  ownPause:[2],           // in deze standen negeert de motor de pauze; jij leest K.S.paused zelf
  stepOnce(){ … },        // toets S
  sound(api){ … },        // elk frame als het geluid aan staat: api.thump(f,dur,vol), api.noise(dur,type,freq,q,vol,att), api.tone(f,dur,vol,type), api.now, api.rip(big), api.click(p)
  onShow(){ … },          // als het niveau zichtbaar wordt
}
```

**Punten** (9 tot 14, minstens 2 per niveau):

```js
{lv:0, name:'Grote bilspier', lat:'M. gluteus maximus',      // Latijn volgens Terminologia Anatomica
 at:()=>W.glMax,                       // ankerpunt (THREE.Vector3) dat meebeweegt; zet het in step() of reset()
 view:[[4,5,8],[1,3,0]],               // camera bij openen
 focus:()=>[gluteusMesh],              // deze objecten blijven zichtbaar, de rest van het niveau wordt doorzichtig
 pick:()=>[gluteusMesh],               // klik op deze objecten opent het punt (standaard gelijk aan focus)
 layer:'Spieren',                      // marker verdwijnt als die laag uit staat
 state:2,                              // optioneel: zet bij openen deze stand aan
 tabs:[uitleg, inDeSport, weetje, '<p class="think">denkvraag</p>']}
```

**Tags** zijn zwevende labels: `{lv, cls:'band'|'atp'|'ca'|'o2'|'co2'|'nerve'|'force', col:'#hex', txt:()=>'O₂', at:()=>V, show:()=>bool}`.

**Lagen:** `{name:'Spieren', lv:0, objs:()=>[…], set(on){…}, on:true}`.

**Speurtocht** (precies 8 opdrachten, RTTI):
- `{t:'R', type:'find', lv:0, state:1, view:[[…],[…]], q:'Klik op …', opts:[()=>W.a,()=>W.b,()=>W.c,()=>W.d], ok:0, fb:['Goed! …','…','…','…']}`
- `{t:'T1', type:'mc', lv:2, state:2, q:'…', opts:['…','…','…','…'], ok:1, ex:'uitleg bij goed', why:['waarom A fout is', null, '…', '…']}`
- `{t:'I', type:'open', q:'…', model:'<p>…</p>'}`

Gebruik 2 à 3 R (waarvan minstens 2 aanwijsopdrachten in 3D), 2 T1, 2 à 3 T2 en 1 I. Elk niveau krijgt minstens één opdracht en elk leerdoel wordt getoetst. Zet het goede antwoord niet steeds op A.

**Film** (8 tot 11 scènes, samen ongeveer 3 à 4 minuten):

```js
scenes:[
 {chap:'', lv:0, st:1, view:CAM.wide, title:['Hoe de heup je sprint draagt','Van bekken tot kraakbeen · drie keer inzoomen'], lines:[
   {t:'Eén à twee korte zinnen per regel.'},
   {t:'…', do:()=>{K.FILM.title=null;}}]},
 {chap:'1 · De heup', lv:0, st:2, lines:[{t:'…', cam:CAM.close},{t:'…', do:L=>{/* L = duur van de regel in s */}, min:5}]},
 {chap:'3 · …', lv:2, st:2, steps:{names:['Binden','Slag','Los'], cur:()=>mijnStap}, setup(){…}, end(){…}, lines:[…]},
 …
 {chap:'Tot slot', lv:0, st:2, lines:[{t:'…'},{t:'', min:5, do:()=>{K.FILM.title=['Verken het zelf','De Bewegingsatlas · …'];}}]}]
```

Elke regel wacht tot de stem klaar is. De motor zoomt zelf naar het juiste niveau en zet de stand. Zet in `film.stop()` alles terug wat je in `setup` of `do` hebt veranderd.

Dit regelt de motor zelf:

- Tijdens de film en de speurtocht staan alle lagen op hun beginstand. Daarna komt de keuze van de kijker terug.
- Na de film komen de graad, slow motion en het geluid terug zoals de kijker ze had.
- Een `goLevel` tijdens het zoomen wacht tot de zoom klaar is, en gaat dus niet verloren.

## K: de gereedschapskist

- Wiskunde en vormen: `K.THREE`, `K.V(x,y,z)`, `K.R()` (toeval met seed), `K.rand(seed)`, `clamp`, `lerp`, `smooth`, `ease`, `bump`, `D2R`, `TAU`, `sunflower(n)`, `hexPts(rings,s)`, `AX`, `AY`, `AZ`.
- Scène: `scene`, `camera`, `renderer`, `controls`, `key`, `hemi`, `rim`, `fill`, `groups`, `W` (jouw ankerpunten), `S` (`lvl`, `state`, `stT`, `clock`, `paused`, `slow`, `xSpeed`, `grade`, `tearFired`, `quality`, `zooming`), `FILM`.
- Meshes en materialen:
  - `mesh(geo,mat,pos,rot,scl,parent)` maakt een mesh met schaduw.
  - `std(color,{…})` is een MeshStandardMaterial, `glass(color,opacity)` doorzichtig, `glow(color,emissive,intensity)` met gloed, `add(color,opacity)` additief (voor gloed, ionen en impulsen).
  - Kant-en-klare materialen: `BONE()`, `CART()`, `MUSC()`, `TEND()`, `ENV.base/edge/metal/dark`.
- Geometriehulpen:
  - `BAND` en `UCYL` zijn cilinders van 0 naar 1 langs y, voor `orient`.
  - `orient(mesh,a,b,w,d)` legt een band van punt a naar b.
  - `segMatrix(a,b,r)` en `placeMatrix(p,rot,s)` maken matrices voor `inst(geo,mat,n)` (InstancedMesh, dynamisch).
  - `tube(pts,r,mat,parent,seg)` maakt een gebogen buis.
  - `lathe([[r,y],…],mat,parent,seg,pos,rot)` maakt een draaivorm.
  - `boneGeo(l,r,kop1,kop2)` maakt een bot met verdikte uiteinden.
  - `canvasTex(w,h,draw,rep)` maakt een getekende textuur.
  - `ZERO` is een matrix om een instance te verbergen.
- Decor:
  - `base({parent, floor:'gym'|'track'|'lab'|'mat'|'split'|texture, plaque:['MUSCULUS …','ondertitel'], w, d})` maakt de museumsokkel met vloer en messing naambord; de bovenkant ligt op y = 0,08.
  - `stand({parent,x,z,h})` geeft `{g,top}`: een paal met voet om een model op te zetten.
  - `floorTex(kind)` en `plaqueTex(t1,t2)` maken los een vloer- of naambordtextuur.
- De sporter: `figure({parent,pos:[x,.08,z],rotY,scale,skin,shirt,shorts,shoe,sole,hair})` geeft `F` met `F.pose({...})`, `F.standY`, de groepen `F.root`, `pelvis`, `torso`, `neck`, `head`, de armen `aR` en `aL` (`{sh,el,wr}`), de benen `lR` en `lL` (`{hip,kn,an}`) en de materialen `F.mats`. `K.mixPose(A,B,t)` mengt twee houdingen.
  - De figuur kijkt naar +z en is ongeveer 2,2 eenheden lang.
  - Heup x < 0 is been naar voren. Knie x > 0 is buigen. Enkel x < 0 is voet omhoog; enkel z is inversie/eversie.
  - Schouder x < 0 is arm naar voren. Rechterschouder z < 0 en linkerschouder z > 0 is zijwaarts heffen. Schouder y is rotatie. Elleboog x < 0 is buigen.
  - Romp: `lean` (naar voren), `side` en `twist`. `py` is de hoogte van het bekken; `px` en `pz` verschuiven het.
  - Voor heupen, schouders, enkels en polsen mag je getallen of `[x,y,z]` geven.
  - Hang extra meshes aan de groepen, bijvoorbeeld een gloeiende spier aan `F.lR.hip`.
- HUD:
  - `capSet(titel,html)` zet het bijschrift.
  - `capSoft(titel,html,min)` doet hetzelfde, maar de vorige tekst blijft minstens 2,6 s staan. Gebruik dit voor alles wat tijdens een beweging wisselt.
  - `stateText()` geeft 'Stand 2 · Sprint'.
  - `bars([...])` met `bar(i,frac,tekst,cls,kleur)`; cls is `ecc`, `con`, `iso`, `ok` of `bad`.
  - `stepsHTML([...])` met `stepOn(i)`.
  - `hudSet` en `ctlSet`.
- Effecten: `flash({big,shake,sound})` geeft een rode flits, scheurgeluid, schermtril en filmflits. `shake(v)`. `SND` is de geluids-api van hierboven.
- Navigatie:
  - `setState(n)` en `goLevel(n,after)`.
  - `flyTo(pos,doel,duur)` vliegt de camera naar een standpunt. Op een staand scherm zet de motor de camera zelf verder weg.
  - `$`, `$$`, en `K.reduced` (prefers-reduced-motion).
- Telefoon (tot 820 px breed):
  - Een open paneel ligt als la onderin, en de HUD wijkt. Houd het onderdeel van een punt daarom in de bovenste helft van het beeld.
  - Met ▾ klapt de kijker het paneel in tot de kop, en dan komt de HUD terug.
  - Tijdens een aanwijsopdracht verbergt de motor de naamlabels.

## Wat een goede halte is

1. **Een echte zoomreis.** Kies 3 tot 5 niveaus die elk tien tot honderd keer dieper gaan: de beweging, het gewricht of orgaan, het weefsel, de cel of het molecuul. Elk niveau heeft een eigen, rijke scène met een eigen kleur en licht, en het verhaal loopt door van niveau naar niveau.
2. **Visueel op het niveau van `spier.html`.** Bouw met procedurele geometrie en geen losse blokjes:
   - instancing voor vezels, cellen en deeltjes;
   - canvastexturen voor streping, vloeren en schalen;
   - doorzichtige vliezen, gloed (emissive en additief), gebogen buizen voor vaten, zenuwen en pezen, en lathe-vormen voor botten en organen;
   - alles wat beweegt, beweegt vloeiend en klopt met de fysiologie.

   Het niveau van de beweging heeft de sokkel met vloer en naambord en een sporter die synchroon met het model beweegt.
3. **Drie standen op elk niveau.** 1 Rust (verkennen), 2 Belasting (de sportbeweging of de functie), 3 Blessure of extreme situatie. Stand 3 heeft een duidelijk moment met `flash()` en daarna gevolgen, zoals zwelling, scheur of uitval. Waar het past, geef je met `grades:true` een keuze in ernst. De namen van de standen passen bij het niveau.
4. **Live feedback in de HUD.** Grootheden die het mechanisme laten zien (hoek, spierwerk, druk, frequentie, volume, spanning) en die precies kloppen met wat het model doet. Wisselende teksten gaan via `capSoft`. Een snelle beweging moet leesbaar zijn: de motor heeft daarvoor Slow motion, en je eigen ctl kan een tempo-schuif hebben.
5. **Inhoud voor de propedeuse ALO.**
   - Nederlands, helder, korte zinnen. Vakinhoudelijk juist: anatomie, fysiologie en biomechanica.
   - Nederlandse en Latijnse namen volgens Terminologia Anatomica.
   - Elk punt heeft vier tabjes: Uitleg (2 à 3 korte alinea's of minder), In de sport (een concrete situatie uit de gymzaal of sport), Weetje (een getal met jaartal of bron als het cijfer kan verouderen) en Denkvraag (in `<p class="think">`).
   - Reken ordegroottes na. Wat de tekst belooft, moet het model laten zien.
   - Geen diagnose- of behandeladvies, en een zakelijke toon bij ernstige situaties.
   - Geen lange gedachtestreepjes in lopende tekst; gebruik een komma of een nieuwe zin. Een streepje voor een bereik (1–3) mag.
6. **Brug naar de les LO en naar de andere haltes.** Leg in de tabjes en de slotvraag het verband met de gymzaal. Link waar zinvol naar andere haltes (`<a href="knie.html#5">`) en labs (`evenwicht.html`, `salto.html`, `bocht.html`, `landing.html`, `ringen.html`). De bestaande haltes zijn `spier.html` (8) en `knie.html` (9). Nieuwe haltes zijn `zenuw.html` (1), `schouder.html` (2), `longen.html` (3), `hart.html` (4), `elleboog.html` (5), `wervel.html` (6), `heup.html` (7) en `enkel.html` (10).
7. **Prestaties.** Ongeveer 30 fps of meer op een gewone laptop. Gebruik InstancedMesh voor herhaling en maak geen geometrie per frame aan (werk instance-matrices bij). Hergebruik vectoren in `step`, en zet zware schaduwen alleen op niveau 0.
8. **Film van ongeveer 3 à 4 minuten.** Een titelkaart, één hoofdstuk per niveau of mechanisme, de blessure, een slot met preventie en een slotkaart 'Verken het zelf'. Zinnen die goed klinken als ze worden voorgelezen.

## Testen (verplicht)

Er draait een lokale server op `http://localhost:8766/` met de map `anatomie 3-D` als root. Gebruik de ingebouwde browser (tools `mcp__Claude_Browser__*`) in een **eigen tabblad**: maak het met `tabs_create`, werk alleen in dat tabblad en sluit het aan het eind. Laad `http://localhost:8766/jouwhalte.html?v=N` (verhoog N na elke wijziging). In een verborgen paneel loopt `requestAnimationFrame` niet. Reken daarom met `window.__atlas.step(120)`: dat rekent twee seconden door en tekent ook. Daarna maak je een screenshot.

- Controleer met `read_console_messages` dat er geen fouten zijn.
- Loop elk niveau en elke stand na en kijk op de screenshot of het mooi en duidelijk is. Bijvoorbeeld:
  ```
  __atlas.goLevel(n)
  // ~1,3 s wachten
  __atlas.setState(2)
  __atlas.step(120)
  __atlas.flyTo(pos, doel, .01)
  __atlas.step(5)
  ```
- Open elk punt (`__atlas.openPoint(i)`), loop de speurtocht door (`__atlas.openQuiz()`) en start de film (`__atlas.filmStart()`, `__atlas.filmScene(k)`). Controleer of de aanwijsopdrachten op een zichtbare plek staan.
- Test ook een smal scherm met `resize_window` (preset mobile) en zet het daarna terug op desktop.
- Itereer tot het er goed uitziet en foutloos werkt.

Werk alleen aan je eigen bestand. Wijzig `atlas3d.js`, `atlas3d.css`, `index.html` en de andere haltes niet. Gebruik geen git.
