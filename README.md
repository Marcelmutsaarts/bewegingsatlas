# De Bewegingsatlas

Anatomie in 3D voor de propedeuse ALO. Proof of concept, geïnspireerd op de diorama's van [De Tijdatlas](https://tijdatlas.netlify.app/).

- `index.html`: de atlas, een lichaamskaart met tien haltes, filters, docentenhandleiding en privacy-uitleg.
- `knie.html`: halte 9, een volledig uitgewerkte 3D-diorama van de rechterknie.

## De kniediorama

Een vergroot anatomisch kniemodel op een standaard, op een stukje gymzaalvloer. Een kleine sporter beweegt synchroon met het model.

- **Drie standen**: rust, squat (met schuif voor de kniehoek) en een landing waarbij de voorste kruisband scheurt, gevolgd door zwelling.
- **Negen punten** met de tabjes uitleg, in de sport, weetje en denkvraag, met Nederlandse en Latijnse namen.
- **Live feedback**: banden kleuren mee met hun spanning, spieren gloeien op bij activatie, en de HUD toont kniehoek, spierwerk (concentrisch/excentrisch) en VKB-spanning.
- **Speurtocht** met 8 opdrachten volgens RTTI: aanwijzen in het model, meerkeuze en een open slotvraag.
- **Lagen**, röntgenbeeld, camerastandpunten, camerarit, gegenereerd geluid en een presentatiestand met clickerbediening.

## Techniek

Statische HTML, zonder build-stap. 3D met three.js r147 via jsDelivr; alle geometrie, texturen en geluiden worden in de browser gegenereerd. Er worden geen cookies geplaatst en geen gegevens opgeslagen.

Het kniemodel is een vereenvoudigde, didactische weergave.
