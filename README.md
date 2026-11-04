# De Bewegingsatlas

Anatomie en biomechanica in 3D voor de propedeuse ALO. De diorama's zijn geïnspireerd op die van [De Tijdatlas](https://tijdatlas.netlify.app/). Live: https://bewegingsatlas.vercel.app

## Twee vleugels

- **Anatomie** (`index.html`): een lichaamskaart met tien haltes, filters, een docentenhandleiding en privacy-uitleg. Elke halte is een 3D-zoomreis: je begint bij de beweging in de gymzaal en zoomt in naar het gewricht of orgaan, het weefsel en de cel.
- **Biomechanica** (`biomechanica.html`): zeven thema's van Newton tot energie, met vijf 3D-labs voor de weken 3 tot en met 7: `evenwicht.html`, `salto.html`, `bocht.html`, `landing.html` en `ringen.html`.

## De haltes van de vleugel Anatomie

| Halte | Bestand | Onderwerp |
|---|---|---|
| 1 | `zenuw.html` | Zenuwstelsel: van prikkel tot beweging, de reflexboog |
| 2 | `schouder.html` | Schouder: het schoudergewricht en de rotator cuff |
| 3 | `longen.html` | Longen: ademhaling bij inspanning |
| 4 | `hart.html` | Hart: hart en bloedsomloop tijdens de bleeptest |
| 5 | `elleboog.html` | Elleboog: hefbomen, biceps en triceps |
| 6 | `wervel.html` | Wervelkolom: wervels, tussenwervelschijven en tillen |
| 7 | `heup.html` | Heup en bekken: kogelgewricht en bilspieren bij de sprint |
| 8 | `spier.html` | Spierweefsel: van spier tot powerslag, en de hamstringscheur |
| 9 | `knie.html` | Knie: kruisbanden, menisci en de landing (de eerste versie staat in `knie-v1.html`) |
| 10 | `enkel.html` | Enkel: enkelverstuiking en de laterale banden |

Elke halte heeft:

- een zoomreis over meerdere schaalniveaus, met drie standen per niveau (rust, belasting, blessure);
- genummerde punten met vier tabjes (uitleg, in de sport, weetje, denkvraag) en Nederlandse en Latijnse namen;
- een speurtocht van acht opdrachten volgens RTTI;
- een presentatiestand en een uitlegfilm met stem en ondertitels (ook te downloaden als video, zonder stem);
- live waarden in de HUD, lagen en gegenereerd geluid.

Je kunt rechtstreeks linken: `#5` opent punt 5, `#niveau=2` een zoomniveau, `#stand=3` een stand, en verder `#speurtocht` en `#film`.

## Techniek

Statische HTML, zonder build-stap. Voor 3D gebruiken we three.js r147 via jsDelivr. Alle geometrie, texturen en geluiden worden in de browser gegenereerd.

De haltes 1–7, 9 en 10 delen één motor: `atlas3d.js` met `atlas3d.css`. Die regelt de schil, de punten, de speurtocht, de zoomladder, het geluid, de presentatiestand en de film. Een halte levert alleen haar 3D-scènes en haar inhoud. Hoe je een halte bouwt, staat in `BOUWEN.md`. `spier.html` is de halte waaruit de motor is afgeleid; die staat nog op zichzelf.

## Privacy

Er zijn geen accounts, cookies of tracking, en antwoorden worden niet opgeslagen. De labs van de vleugel Biomechanica onthouden alleen hun instellingen (zoals een gekozen houding) in de browser. De stem van de uitlegfilm komt van de browser. Sommige browsers gebruiken daarvoor een online stem, waardoor de filmtekst naar Microsoft of Google gaat.

De modellen zijn vereenvoudigde, didactische weergaven.
