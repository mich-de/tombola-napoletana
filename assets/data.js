/* Tombola Napoletana – dati: smorfia, avatar, premi.
   Un'idea di Michele De Angelis · mdeangelis.me */
(function (root) {
  // [numero, napoletano, italiano, emoji, storiella]
  const SMORFIA = [
    [1, "L'Italia", "L'Italia", "🇮🇹", "Il numero uno, una cosa unica: dopo l'Unità d'Italia è diventato la patria. Si dice con orgoglio e la mano sul petto."],
    [2, "'a Criatura", "La bambina, la creatura", "👧", "'A criatura è il neonato, il piccolo di casa: sognarlo annuncia una novità in famiglia."],
    [3, "'a Jatta", "La gatta", "🐱", "La gatta di casa, furba e misteriosa: nei sogni porta segreti svelati e intuizioni improvvise."],
    [4, "'o Puorco", "Il maiale", "🐷", "Il porco: l'abbondanza e l'ingordigia. Del maiale non si butta niente, e nemmeno di chi mangia come lui."],
    [5, "'a Mano", "La mano", "✋", "La mano che dà e che prende, che fa le corna contro la iella e che a tombola segna i numeri."],
    [6, "Chella ca guarda 'nterra", "L'organo femminile", "🐚", "Il 6 è 'chella che guarda 'nterra', cioè quella che guarda in basso: è il sesso della donna, detto con pudore e malizia."],
    [7, "'o Vasetto", "Il vasetto", "🏺", "'O vasetto, il piccolo vaso: oggetto di casa che nella tradizione popolare nasconde anche un doppio senso."],
    [8, "'a Maronna", "La Madonna", "🙏", "La Madonna, protettrice di Napoli e di tutte le famiglie: davanti a lei ci si fa il segno della croce."],
    [9, "'a Figliata", "La figliolanza, la prole", "👨‍👩‍👧‍👦", "'A figliata è il parto e la nidiata di figli: sognarla promette famiglia numerosa."],
    [10, "'e Fasule", "I fagioli", "🫘", "I fagioli, cibo del popolo: una volta erano i segnanumeri della tombola, e il dopo cena… si sente."],
    [11, "'e Surice", "I topi", "🐭", "'E surice, i topi: piccoli ladruncoli di casa, girano attorno al tavolo quando nessuno guarda."],
    [12, "'e Surdate", "I soldati", "💂", "'E surdate, i soldati che marciano: nella tombola chiamano ordine, ma pensano solo alle ragazze."],
    [13, "Sant'Antonio", "Sant'Antonio", "😇", "Sant'Antonio, il santo dei miracoli e delle cose perdute: si festeggia il 13 giugno, da qui il numero."],
    [14, "'o Mbriaco", "L'ubriaco", "🥴", "'O 'mbriaco, che barcolla tra un bicchiere e l'altro e abbraccia i lampioni scambiandoli per la moglie."],
    [15, "'o Guaglione", "Il ragazzo", "🧒", "'O guaglione, il ragazzo del vicolo: sveglio, sfrontato e sempre in mezzo ai guai."],
    [16, "'o Culo", "Il sedere", "🍑", "'O culo, il deretano: ma a Napoli è anche la fortuna sfacciata. Chi ha culo, vince la tombola!"],
    [17, "'a Disgrazia", "La disgrazia", "😱", "La disgrazia: il 17 porta sfortuna perché in numeri romani XVII anagrammato fa VIXI, 'ho vissuto', cioè sono morto."],
    [18, "'o Sanghe", "Il sangue", "🩸", "'O sanghe, il sangue: quello di San Gennaro che si scioglie nel miracolo, segno di buona sorte per Napoli."],
    [19, "'a Resata", "La risata", "😂", "'A resata, la risata grassa e contagiosa, che a tombola non manca mai."],
    [20, "'a Festa", "La festa", "🎉", "'A festa: musica, cibo e baldoria, come quella del Natale napoletano."],
    [21, "'a Femmena annura", "La donna nuda", "💃", "'A femmena annura, la donna nuda: il numero più chiamato dagli uomini al tavolo, con occhiolino incluso."],
    [22, "'o Pazzo", "Il pazzo", "🤪", "'O pazzo, il matto del quartiere che dice verità che nessuno vuole sentire."],
    [23, "'o Scemo", "Lo scemo", "🤡", "'O scemo, lo stupido: chi non capisce la battuta e ride sempre per ultimo."],
    [24, "'e Gguardie", "Le guardie", "👮", "'E gguardie, i gendarmi: arrivano sempre quando la festa è finita."],
    [25, "Natale", "Natale", "🎄", "Il 25 dicembre, il Santo Natale: il numero più atteso della tombola delle feste."],
    [26, "Nanninella", "Annarella (diminutivo di Anna)", "👩", "Nanninella è il vezzeggiativo di Anna: la ragazza del popolo, curiosa e pettegola, che sa tutto di tutti."],
    [27, "'o Cantero", "Il vaso da notte", "🚽", "'O cantero, il pitale che si teneva sotto il letto prima dei bagni in casa: oggetto umile e ridicolo."],
    [28, "'e Zzizze", "Il seno", "🍈", "'E zzizze, il seno femminile: quando esce il 28 tutti gli uomini al tavolo si fanno attenti."],
    [29, "'o Pate d''e criature", "L'organo maschile", "🍆", "'O pate d''e criature, il padre dei bambini: con malizia indica il membro maschile, quello che 'fa' i figli."],
    [30, "'e Palle d''o tenente", "I testicoli del tenente", "🍒", "'E palle d''o tenente: i testicoli del tenente, simbolo di coraggio… o di chi crede di averne tanto."],
    [31, "'o Patrone 'e casa", "Il padrone di casa", "🏠", "'O padrone 'e casa, il proprietario che bussa a fine mese per l'affitto: il più temuto del palazzo."],
    [32, "'o Capitone", "Il capitone", "🐍", "'O capitone, la grossa anguilla femmina fritta alla Vigilia di Natale: scappa dalla bacinella e fa strillare le donne."],
    [33, "Ll'anne 'e Cristo", "Gli anni di Cristo", "✝️", "Ll'anne 'e Cristo: 33, gli anni che aveva Gesù quando fu crocifisso."],
    [34, "'a Capa", "La testa", "🧠", "'A capa, la testa: chi ha la testa dura e chi la perde per una bella donna."],
    [35, "L'Aucelluzz", "L'uccellino", "🐦", "L'aucelluzzo, l'uccellino che canta: e col solito doppio senso napoletano, anche qualcos'altro."],
    [36, "'e Ccastagnelle", "Le nacchere (e i petardi)", "🪇", "'E castagnelle: le nacchere della tarantella, ma anche i petardi di Capodanno che scoppiettano."],
    [37, "'o Monaco", "Il monaco", "🧘", "'O monaco, il frate: pio di giorno e, secondo le malelingue, un po' meno di notte."],
    [38, "'e Mmazzate", "Le botte", "🥊", "'E mmazzate, le botte: quelle che volano nelle liti di famiglia o tra innamorati gelosi."],
    [39, "'a Funa 'nganna", "La corda al collo", "🪢", "'A funa 'nganna, il cappio al collo: quando sei nei guai… o quando ti sposi!"],
    [40, "'a Paposcia", "L'ernia (la noia)", "🥱", "'A paposcia è l'ernia inguinale, il gonfiore 'là sotto': per estensione chi è lento, pesante e noioso."],
    [41, "'o Curtiello", "Il coltello", "🔪", "'O curtiello, il coltello: quello per il panettone e quello della moglie gelosa."],
    [42, "'o Ccafè", "Il caffè", "☕", "'O ccafè, il caffè napoletano fatto con la cuccuma: a Napoli si offre a tutti, sempre."],
    [43, "'a Donna 'o barcone", "La donna al balcone", "🪟", "'A femmena 'ncopp' 'o balcone, che si affaccia, guarda chi passa e cala il panariello con la corda."],
    [44, "'e Ccancelle", "Il carcere", "⛓️", "'E ccancelle, le sbarre: la prigione dove finisce chi fa il furbo."],
    [45, "'o Vino", "Il vino buono", "🍷", "'O vino bbuono, quello che si stappa per le feste: 'na bella buttiglia 'e vino!"],
    [46, "'e Denare", "Il denaro", "💰", "'E denare, i soldi: tutti li sognano e pochi li vincono."],
    [47, "'o Muorto", "Il morto", "💀", "'O muorto: nella smorfia sognare un morto è di buon augurio, perché porta numeri da giocare."],
    [48, "'o Muorto che parla", "Il morto che parla", "👻", "'O muorto che parla: il defunto che appare in sogno e suggerisce i numeri del lotto."],
    [49, "'o Piezzo 'e carne", "Il pezzo di carne", "🥩", "'O piezzo 'e carne, la carne del ragù della domenica: e con malizia anche il 'bel pezzo' di persona."],
    [50, "'o Ppane", "Il pane", "🥖", "'O ppane, il pane: il bene più semplice e prezioso, da non buttare mai."],
    [51, "'o Ciardino", "Il giardino", "🌳", "'O ciardino, il giardino: luogo di pace e di incontri segreti tra innamorati."],
    [52, "'a Mamma", "La mamma", "🤱", "'A mamma: sacra, sempre presente, con il cucchiaio di legno in mano."],
    [53, "'o Viecchio", "Il vecchio", "👴", "'O viecchio, l'anziano: saggio, brontolone e ancora galante."],
    [54, "'o Cappiello", "Il cappello", "🎩", "'O cappiello, il cappello: si toglie per salutare e si usa per nascondere l'imbarazzo."],
    [55, "'a Museca", "La musica", "🎶", "'A museca, la musica: mandolini, tammorre e serenate sotto il balcone."],
    [56, "'a Caruta", "La caduta", "🤕", "'A caruta, la caduta: chi scivola per strada e chi cade in disgrazia."],
    [57, "'o Scartellato", "Il gobbo", "🍀", "'O scartellato, il gobbo: toccargli la gobba porta fortuna, almeno così si dice."],
    [58, "'o Paccotto", "Il pacco, l'imbroglio", "🎁", "'O paccotto: il regalo impacchettato, ma soprattutto il 'pacco' napoletano, la fregatura di chi ti vende un mattone per un televisore."],
    [59, "'e Pile", "I peli", "🧔", "'E pile, i peli: sul petto dell'uomo vero, o nell'uovo per chi cerca il pelo."],
    [60, "Se lamenta", "Si lamenta", "😩", "Se lamenta: chi si lagna sempre, del tempo, della salute e soprattutto della tombola."],
    [61, "'o Cacciatore", "Il cacciatore", "🏹", "'O cacciatore: a caccia di lepri, ma soprattutto di belle donne."],
    [62, "'o Muorto acciso", "Il morto ammazzato", "🗡️", "'O muorto acciso, l'uomo ucciso: i fattacci di cronaca che finiscono sempre al lotto."],
    [63, "'a Sposa", "La sposa", "👰", "'A sposa, la sposa: bella, emozionata e piena di promesse per la prima notte."],
    [64, "'a Sciammeria", "La marsina", "🤵", "'A sciammeria, la marsina, l'abito da cerimonia dello sposo e dei signori."],
    [65, "'o Chianto", "Il pianto", "😭", "'O chianto, il pianto: di dolore, di gioia o di chi ha perso a tombola."],
    [66, "'E ddoje zetelle", "Le due zitelle", "👯", "'E ddoje zetelle, le due zitelle: sorelle non sposate, sempre a caccia di un marito."],
    [67, "'o Totaro int''a chitarra", "Il totano nella chitarra", "🦑", "'O totaro int' 'a chitarra, il totano nella chitarra: immagine allusiva e un po' sconcia dell'atto amoroso."],
    [68, "'a Zuppa cotta", "La zuppa cotta", "🍲", "'A zuppa cotta, la minestra ben cotta: e anche chi è sfinito, 'cotto' dalla fatica… o dall'amore."],
    [69, "Sott'e 'ncoppa", "Sottosopra", "🙃", "Sott'e 'ncoppa: il 69, che letto al contrario resta uguale, sottosopra… e i più maliziosi sanno perché."],
    [70, "'o Palazzo", "Il palazzo", "🏛️", "'O palazzo, il vecchio palazzo del vicolo dove tutti sanno i fatti di tutti."],
    [71, "L'ommo 'e merda", "L'uomo senza valore", "💩", "L'ommo 'e merda: l'uomo senza principi né parola, di cui non fidarsi mai."],
    [72, "'a Meraviglia", "La meraviglia, lo stupore", "😲", "'A maraviglia: lo stupore di chi vede qualcosa di incredibile… e resta a bocca aperta."],
    [73, "'o Spitale", "L'ospedale", "🏥", "'O spitale, l'ospedale: dove si finisce dopo un incidente… o una cena di Natale troppo abbondante."],
    [74, "'a Rotta", "La grotta", "🕳️", "'A rotta, la grotta: quella del presepe, dove nacque Gesù Bambino."],
    [75, "Pullecenella", "Pulcinella", "🎭", "Pullecenella, la maschera di Napoli: povero, furbo, affamato e sempre pronto alla battuta."],
    [76, "'a Funtana", "La fontana", "⛲", "'A funtana, la fontana della piazza, dove le donne andavano a prendere l'acqua e a spettegolare."],
    [77, "'e Riavule", "I diavoli (le gambe delle donne)", "😈", "'E riavule, i diavoli: ma il 77 ricorda anche due belle gambe di donna, che tentano come il demonio."],
    [78, "'a Bella figliola", "La bella ragazza", "💋", "'A bella figliola: la ragazza bellissima che fa girare la testa a tutto il vicolo (e in certe smorfie, la donna di facili costumi)."],
    [79, "'o Mariuolo", "Il ladro", "🦹", "'O mariuolo, il ladro di strada: svelto di mano, ruba anche quello che non serve."],
    [80, "'a Vocca", "La bocca", "👄", "'A vocca, la bocca: per mangiare, per baciare e per parlare troppo."],
    [81, "'e Sciure", "I fiori", "💐", "'E sciure, i fiori: per la fidanzata, per la Madonna e per farsi perdonare."],
    [82, "'a Tavula 'mbandita", "La tavola imbandita", "🍽️", "'A tavula 'mbandita, la tavola apparecchiata della festa, piena di ogni ben di Dio."],
    [83, "'o Maletiempo", "Il maltempo", "🌧️", "'O maletiempo, il brutto tempo: pioggia e vento che rovinano i piani."],
    [84, "'a Chiesa", "La chiesa", "⛪", "'A chiesa, la chiesa del quartiere, dove si prega per la salute e… per i numeri."],
    [85, "Ll'aneme 'o priatorio", "Le anime del purgatorio", "🕯️", "Ll'aneme 'o priatorio, le anime purganti: a Napoli si pregano perché in cambio diano i numeri giusti."],
    [86, "'a Puteca", "La bottega, il negozio", "🏪", "'A puteca, la bottega sotto casa, piena di salumi, formaggi e chiacchiere."],
    [87, "'e Perucchie", "I pidocchi", "🐜", "'E perucchie, i pidocchi: fastidiosi come i parenti che vengono solo per mangiare."],
    [88, "'e Casecavalle", "I caciocavalli", "🧀", "'E casecavalle, i caciocavalli appesi a coppia: l'88 ricorda due forme di formaggio… e con malizia qualcos'altro."],
    [89, "'a Vecchia", "La vecchia", "👵", "'A vecchia, l'anziana di casa: saggia, pettegola e imbattibile a tombola."],
    [90, "'a Paura", "La paura", "😨", "'A paura, l'ultimo numero: perché 'la paura fa novanta'."]
  ];

  // [id, nome, emoji, descrizione]
  const PRESEPE = [
    ["p1", "Benino", "😴", "Il pastorello che dorme: tutto il presepe è il suo sogno"],
    ["p2", "Ciccibacco", "🍷", "Il re delle osterie, sempre su un carro di botti"],
    ["p3", "'O Munaciello", "🧙", "Lo spiritello dispettoso che nasconde le cose"],
    ["p4", "'A Bella 'Mbriana", "🧚", "Lo spirito buono che protegge la casa"],
    ["p5", "Il pescatore", "🎣", "Pesca anime, ma soprattutto capitoni"],
    ["p6", "Lo zampognaro", "🎶", "Suona la novena per tutto il vicolo"],
    ["p7", "Il pizzaiolo", "🍕", "Pala in mano, forno a legna sempre acceso"],
    ["p8", "L'oste", "🍖", "Ha la taverna sulla strada per Betlemme"],
    ["p9", "La lavandaia", "🧺", "Stende i panni bianchi accanto alla grotta"],
    ["p10", "Il fornaio", "🥖", "Il pane caldo esce dal forno a mezzanotte"],
    ["p11", "'O castagnaro", "🌰", "Castagne arrostite col fumo che profuma il vicolo"],
    ["p12", "Il pescivendolo", "🐟", "Urla i prezzi più forte di tutti"],
    ["p13", "Il fruttivendolo", "🍊", "Arance, mandarini e la frutta più bella"],
    ["p14", "Stefania", "🪨", "La giovane che portò in braccio una pietra fasciata"],
    ["p15", "Il Re Magio", "👑", "Arriva da lontano con oro, incenso e mirra"],
    ["p16", "Il cammelliere", "🐫", "Guida la carovana verso la stella"],
    ["p17", "La zingara", "🔮", "Legge la mano e predice i numeri"],
    ["p18", "L'angelo annunciatore", "😇", "Annuncia la buona novella dall'alto"],
    ["p19", "Il bue", "🐂", "Scalda la grotta col suo fiato"],
    ["p20", "L'asinello", "🫏", "Paziente e fedele, sempre accanto al bue"],
    ["p21", "San Giuseppe falegname", "🪚", "Pialla, sega e tanta pazienza"],
    ["p22", "Il pastore con la pecora", "🐑", "Porta in spalla la pecorella smarrita"],
    ["p23", "'O scarparo", "👞", "Il calzolaio che risuola le scarpe dei pastori"],
    ["p24", "Il cantastorie", "📜", "Racconta storie di piazza in piazza"],
    ["p25", "Il venditore di babà", "🧁", "Babà al rum, morbidi e lucidi"],
    ["p26", "'O sfogliatellaro", "🥐", "Riccia o frolla? Lui le ha tutte e due"],
    ["p27", "'O pazzariello", "🥁", "Il banditore in uniforme che annuncia le novità"],
    ["p28", "'A capèra", "💇", "La pettinatrice che sa tutti i pettegolezzi"],
    ["p29", "L'acquaiolo", "🍋", "Acqua fresca e limone per i pastori assetati"],
    ["p30", "Il posteggiatore", "🎸", "Musicista di strada, canta sotto i balconi"],
    ["p31", "'O cornicello", "🌶️", "Il corno rosso contro il malocchio"],
    ["p32", "Lo scugnizzo", "🧢", "Il ragazzino del vicolo, svelto e simpatico"]
  ];

  const MODERNI = [
    ["m1", "L'influencer", "🤳", "Col ring light anche nella grotta"],
    ["m2", "Il rider", "🛵", "Consegna i pacchi pure ai Re Magi"],
    ["m3", "Lo smart-worker in pigiama", "🛌", "Giacca sopra, pigiama sotto"],
    ["m4", "Il calciatore che esulta", "⚽", "Esulta anche per un ambo"],
    ["m5", "Il tifoso con la sciarpa", "🧣", "Canta il coro anche al cenone"],
    ["m6", "Il politico al talk show", "🎙️", "Promette tombola a tutti"],
    ["m7", "Il turista col selfie stick", "📸", "Fotografa il presepe dal basso"],
    ["m8", "Il podcaster", "🎧", "Ha un podcast sulla smorfia, episodio 90"],
    ["m9", "Il gamer", "🎮", "Ha provato a fare speedrun della tombola"],
    ["m10", "Il crypto-entusiasta", "🪙", "Vuole pagare la cartella in token"],
    ["m11", "Il runner", "🏃", "Corre anche il 25 dicembre, all'alba"],
    ["m12", "Lo chef stellato", "👨‍🍳", "Destruttura la pastiera"],
    ["m13", "Il meteorologo", "🌦️", "Prevede il 90 con l'80% di probabilità"],
    ["m14", "Il food blogger", "🍝", "Fotografa il piatto prima di mangiarlo"],
    ["m15", "L'esperto di IA", "🤖", "Dice che il prossimo numero lo sa l'algoritmo"],
    ["m16", "Il monopattinista", "🛴", "Sfreccia per i vicoli di San Gregorio Armeno"],
    ["m17", "Quello del \"ci aggiorniamo\"", "📅", "Ha in agenda un aggiornamento anche oggi"],
    ["m18", "Quello col microfono muto", "🔇", "\"Mi sentite? Ho fatto ambo!\""],
    ["m19", "Il fantasma della macchinetta", "👻", "Appare solo vicino alla macchinetta del caffè"],
    ["m20", "Il re dei fogli Excel", "📊", "Ha la pivot dei numeri usciti"],
    ["m21", "La regina delle slide", "📽️", "Ha fatto una presentazione sulla cinquina"],
    ["m22", "Quello del \"rispondi a tutti\"", "📧", "Ha mandato gli auguri a tutta l'azienda"],
    ["m23", "Il cacciatore di ferie", "🏖️", "Ha già prenotato i ponti del 2027"],
    ["m24", "Lo stagista entusiasta", "🌟", "Prende appunti anche alla tombola"],
    ["m25", "Il capo che \"ha 5 minuti\"", "⏱️", "Cinque minuti che durano un'ora"],
    ["m26", "Quello della \"call veloce\"", "📞", "Veloce come il cenone di Natale"],
    ["m27", "L'IT del \"hai provato a riavviare?\"", "🔌", "Lo dice anche alla cartella"],
    ["m28", "Il pendolare", "🚆", "Gioca a tombola sul regionale in ritardo"]
  ];

  const NATALE = [
    ["n1", "Babbo Natale", "🎅", "Ho-ho-ho, e poi ambo!"],
    ["n2", "La Befana", "🧹", "Vien di notte con le scarpe tutte rotte"],
    ["n3", "La renna", "🦌", "Ha il naso freddo e lo zoccolo fortunato"],
    ["n4", "L'elfo", "🧝", "Impacchetta regali e fa i turni di notte"],
    ["n5", "Il pupazzo di neve", "⛄", "Naso di carota, sorriso di carbone"],
    ["n6", "Lo schiaccianoci", "🥜", "Soldatino di legno, schiaccia noci e avversari"],
    ["n7", "L'angioletto", "👼", "In cima all'albero, sorveglia le cartelle"],
    ["n8", "Lo zio dopo il cenone", "🛋️", "Si addormenta sul divano tra un numero e l'altro"],
    ["n9", "La nonna della tombola", "👵", "Tiene il panariello, non lo molla a nessuno"],
    ["n10", "Il cugino che vince sempre", "🏆", "Nessuno sa come, ma vince sempre"],
    ["n11", "Il panettone", "🍞", "Con o senza canditi? Eterno dibattito"],
    ["n12", "Il pandoro", "⭐", "Stella dorata con lo zucchero a velo"],
    ["n13", "Il torrone", "🍫", "Duro o morbido, l'importante è che ci sia"],
    ["n14", "La stella cometa", "🌠", "Indica la strada verso la tombola"],
    ["n15", "L'albero di Natale", "🎄", "Addobbato, luminoso e un po' storto"],
    ["n16", "Il regalo riciclato", "🎁", "Era già stato regalato nel 2019"],
    ["n17", "Lo struffolo", "🍯", "Pallina di miele, attaccata a tutte le altre"],
    ["n18", "Lo zampone", "🥓", "Arriva a Capodanno con le lenticchie"],
    ["n19", "Le lenticchie", "🫘", "Più ne mangi, più soldi farai"],
    ["n20", "Il calendario dell'Avvento", "🗓️", "Finito il 3 dicembre. Tutto in una volta"],
    ["n21", "La palla di neve", "🔮", "Agitala e nevica sul Vesuvio"],
    ["n22", "La slitta", "🛷", "Parcheggiata in doppia fila sul tetto"],
    ["n23", "Il bambino che aspetta i regali", "🧒", "Sveglio alle cinque del mattino"],
    ["n24", "Il gatto sull'albero", "🐈", "Ha già fatto cadere tre palline"],
    ["n25", "Le luci che non si accendono", "💡", "Una lampadina rotta e si spegne tutto"],
    ["n26", "Il maglione natalizio", "🧶", "Renne e fiocchi di neve, regalo della zia"],
    ["n27", "Il vischio", "🌿", "Chi ci passa sotto deve fare gli auguri"],
    ["n28", "Lo spumante", "🍾", "Il tappo vola alla mezzanotte di San Silvestro"]
  ];

  const AVATARS = [];
  const COLORS = ["#c0392b", "#16a085", "#d35400", "#2c3e50", "#8e44ad", "#27ae60", "#b9770e", "#1f618d", "#a93226", "#117864"];
  SMORFIA.forEach(([n, nap, it, e]) => AVATARS.push({ id: "s" + n, cat: "smorfia", num: n, name: nap, sub: it, e, color: COLORS[n % COLORS.length] }));
  PRESEPE.forEach(([id, name, e, sub], i) => AVATARS.push({ id, cat: "presepe", name, sub, e, color: COLORS[(i + 3) % COLORS.length] }));
  MODERNI.forEach(([id, name, e, sub], i) => AVATARS.push({ id, cat: "moderni", name, sub, e, color: COLORS[(i + 5) % COLORS.length] }));
  NATALE.forEach(([id, name, e, sub], i) => AVATARS.push({ id, cat: "natale", name, sub, e, color: COLORS[(i + 7) % COLORS.length] }));
  const AVATAR_BY_ID = Object.fromEntries(AVATARS.map(a => [a.id, a]));
  // il cartellone (banco) gioca anche lui: avatar speciale, non selezionabile
  AVATAR_BY_ID.banco = { id: "banco", cat: "speciale", name: "Il Banco", sub: "il cartellone", e: "🧺", color: "#5c0f14" };

  const LEVELS = [
    { key: "ambo", label: "Ambo", need: 2 },
    { key: "terno", label: "Terno", need: 3 },
    { key: "quaterna", label: "Quaterna", need: 4 },
    { key: "cinquina", label: "Cinquina", need: 5 },
    { key: "tombola", label: "Tombola", need: 15 },
    { key: "tombolino", label: "Tombolino", need: 15 }
  ];

  const DEFAULT_PRIZES = {
    ambo: ["Caffè offerto dal capo ☕", "Cornetto alla crema 🥐", "Pacco di taralli 🥨", "Torroncini assortiti 🍬"],
    terno: ["Panettoncino 🍞", "Bottiglia di spumante 🍾", "Tazza natalizia ☕", "Scatola di cioccolatini 🍫"],
    quaterna: ["Pandoro ⭐", "Torrone artigianale 🍫", "Buono pranzo 🍝"],
    cinquina: ["Buono regalo da 20 € 🎟️", "Cesto di dolci 🧺"],
    tombola: ["Cesto natalizio gigante 🧺", "Buono regalo da 50 € 🎁"],
    tombolino: ["Panettone artigianale 🎄", "Bottiglia di vino buono 🍷"]
  };

  const REACTIONS = ["😂", "😡", "😱", "👏", "🎉", "😭", "🍀", "💨"];

  const CREDITS = { author: "Michele De Angelis", site: "mdeangelis.me", url: "https://mdeangelis.me", version: "2.0.0", year: 2026 };

  const data = { SMORFIA, AVATARS, AVATAR_BY_ID, LEVELS, DEFAULT_PRIZES, REACTIONS, CREDITS };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else root.TOMBOLA_DATA = data;
})(typeof globalThis !== "undefined" ? globalThis : this);

/* Filastrocche napoletane (originali) e numeri detti in napoletano */
(function (root) {
  const D = (typeof module !== "undefined" && module.exports) ? module.exports : root.TOMBOLA_DATA;
  D.RIME = [
    "L'Italia è nu stivale ca cammina, e Napule è 'a scarpa cchiù fina!",
    "'A criatura vence sempe: è piccerella, ma è cchiù furba 'e tutte quante!",
    "'A jatta guarda 'o pesce 'ncopp' 'a tavola: chi s'addorme, perde 'a cena!",
    "'O puorco: 'e chisto nun se jetta niente, manco 'o grugnito!",
    "'A mano: chi tene 'e mane longhe s'arrobba pure 'e fasule d'a cartella!",
    "Chella ca guarda 'nterra: nun 'a guardà tu, ca te fa arrussì!",
    "'O vasetto: sotto 'o lietto d'a nonna, pronto pe' ll'emergenze!",
    "'A Maronna t'accumpagna... ma 'a cinquina t'a faje tu!",
    "'A figliata: tanta criature, e na cartella sola pe' tutte quante!",
    "'E fasule: pe' segnà 'e nummere... e pe' fa' 'a musica doppo cena!",
    "'E surice abballano quanno 'a jatta nun ce sta!",
    "'E surdate marciano: uno, ddoje... e uno se perde sempe!",
    "Sant'Antonio, Sant'Antonio, fance truvà 'a cartella e pure 'o matrimonio!",
    "'O 'mbriaco vede ddoje cartelle, e fa ddoje tombole!",
    "'O guaglione: tene quinnece anne e se crede 'o padrone d'o munno!",
    "Sìrice, 'o culo: chi 'o tene vence! E stasera chi 'o tene?",
    "Dicessette, 'a disgrazia: tuccate ferro, e pure quacche cos'ato!",
    "'O sanghe: 'o sanghe nun è acqua, ma manco 'o vino!",
    "'A resata: ride buono chi fa tombola pe' ultimo!",
    "'A festa: e quanno maje se ferma 'a festa a Napule?",
    "'A femmena annura: zi', stuta 'e lente, ca s'appannano!",
    "'O pazzo: joca diece cartelle e nun ne segna manco una!",
    "'O scemo: chi 'o chiamma e chi s'o sente!",
    "'E gguardie: arrivano sempe quanno 'a festa è già fernuta!",
    "Natale: panettone, struffoli e na tombola ca nun fernesce maje!",
    "Nanninella: piccerella, ma quanno parla 'a sente tutto 'o palazzo!",
    "'O cantero: 'o tesoro d'a nonna, sotto 'o lietto, sempe chino!",
    "'E zzizze: vintotto, e 'o zio fa finta 'e nun avè sentuto!",
    "'O pate d'e criature: vintinove, e tutte 'e femmene s'ammuccano 'a risata!",
    "'E palle d'o tenente: trenta, e 'o tenente ancora 'e sta cercanno!",
    "'O padrone 'e casa: arriva 'o primmo d'o mese, comme 'a sfurtuna!",
    "'O capitone: scappa d'a vacinella, ma 'a nonna è cchiù veloce!",
    "Trentatré, ll'anne 'e Cristo: 'o nummero cchiù santo d'a tombola!",
    "'A capa: chi nun tene capa, adda tené gamme... e cartelle!",
    "L'aucelluzzo: piccerillo piccerillo, ma canta cchiù forte 'e tutte!",
    "'E ccastagnelle: tric e trac, e s'abballa 'a tarantella!",
    "'O monaco: prega pe' ll'ambo, ma 'a cinquina 'a vo' tutta pe' isso!",
    "'E mmazzate: chelle ca se pigliano quanno se sposta nu fasulo!",
    "'A funa 'nganna: quanno te manca nu nummero sulo... e nun esce maje!",
    "'A paposcia: ll'ernia 'e zi' Peppe, gonfia comme 'nu pallone… e isso nun se move cchiù!",
    "'O curtiello: taglia 'o panettone, ma 'e fette tutte eguale, eh!",
    "'O ccafè: a Napule nun se nega a nisciuno, manco a mezzanotte!",
    "'A donna 'o barcone: vede tutto, sape tutto, e 'o dice a tutte!",
    "'E ccancelle: addò fernesce chi s'arrobba 'e nummere!",
    "'O vino: chillo buono 'o tene annascuso 'o zio dint' 'a cantina!",
    "'E denare: 'e sorde fanno venì 'a vista pure a 'e cecate!",
    "'O muorto: nun te mettere paura, ca a tombola porta furtuna!",
    "'O muorto che parla: e che dice? Joca 'o quarantotto!",
    "'O piezzo 'e carne: e chi s'o magna primma, vence!",
    "'O ppane: cinquanta, e 'a scarpetta dint' 'o ragù nun s'a leva nisciuno!",
    "'O ciardino: addò 'o nonno chianta 'e pummarole e 'e speranze!",
    "'A mamma: 'e mamma ce n'è una sola, e tene sempe ragione!",
    "'O viecchio: sape tutte 'e nummere a mmemoria, e 'e chiamma primma!",
    "'O cappiello: levatello, ca annanze a 'a tombola s'adda purtà rispetto!",
    "'A museca: e mo' sunate, ca stasera nun dorme nisciuno!",
    "'A caruta: so' caduti tutte 'e fasule d'a cartella... che disgrazia!",
    "'O scartellato: tuccate 'a scartellatura, ca porta bene!",
    "'O paccotto: speramme ca è nu regalo, e no nu pacco napulitano!",
    "'E pile: chi tene 'o pilo 'ncopp' 'o stommaco vence 'a tombola!",
    "Se lamenta: chi perde dice sempe ca 'e cartelle erano truccate!",
    "'O cacciatore: spara a 'e nummere comme fossero aucielle!",
    "'O muorto acciso: e chi è stato? 'O tombolino, 'o tombolino!",
    "'A sposa: bella, emozionata, e cu 'a cartella dint' 'a borsetta!",
    "'A sciammeria: 'a giacca bona d'o sposo, già macchiata 'e sugo!",
    "'O chianto: chi chiagne pecché perde, e chi chiagne pe' 'a gioia!",
    "'E ddoje zetelle: sissantaséje, e se sparteno pure l'ambo!",
    "'O totaro dint' 'a chitarra: nisciuno sape pecché, ma sona buono!",
    "'A zuppa cotta: calda calda, pe' sti serate 'e vierno!",
    "Sott'e 'ncoppa: comme 'a casa doppo 'o cenone 'e Natale!",
    "'O palazzo: e 'ncopp' a ogni barcone ce sta na tombola appicciata!",
    "L'ommo 'e merda: chillo ca vene a cena e nun porta manco 'o vino!",
    "'A meraviglia: 'a faccia 'e chi fa tombola 'o primmo giro!",
    "'O spitale: addò se va doppo 'a terza porzione 'e struffoli!",
    "'A rotta: comme chella d'o presepe, addò è accummenciato tutto!",
    "Pullecenella: fa 'o scemo pe' nun ghì a faticà, ma 'a tombola 'a vence!",
    "'A funtana: votta l'acqua e votta 'a sciorta!",
    "'E riavule: sittantasette, 'e gamme d'e femmene... e 'o riavulo ce mette 'a coda!",
    "'A bella figliola: passa, e 'o banco se scorda 'e chiammà 'o nummero!",
    "'O mariuolo: tenite 'e mmane 'ncopp' 'e cartelle!",
    "'A vocca: chella ca chiamma 'e nummere e se magna 'o panettone!",
    "'E sciure: e pe' ogni cinquina, nu mazzo 'e sciure!",
    "'A tavula 'mbandita: chiena 'e piatte, e sotto 'e cartelle!",
    "'O maletiempo: fore chiove, ma dinto se joca a tombola!",
    "'A chiesa: doppo 'a messa 'e mezzanotte, tutte a casa a jucà!",
    "Ll'aneme d'o priatorio: pregate pe' lloro, ca lloro ve danno 'e nummere!",
    "'A puteca: sotto casa, addò s'accattano 'e cartelle e 'o torrone!",
    "'E perucchie: piccerille e fastidiose, comme chi addimanna «che è asciuto?»",
    "'E casecavalle: uttantotto, appise comme ddoje pere!",
    "'A vecchia: vence sempe essa, e nisciuno ha capito maje comme!",
    "Nuvanta, 'a paura: e 'a paura fa nuvanta!"
  ];
  const U = ["", "uno", "ddoje", "tre", "quatto", "cinche", "séje", "sette", "otto", "nove"];
  const SPECIAL = { 1: "uno", 2: "ddoje", 3: "tre", 4: "quatto", 5: "cinche", 6: "séje", 7: "sette", 8: "otto", 9: "nove", 10: "dièce",
    11: "ùnnece", 12: "dùrece", 13: "trìrece", 14: "quattuòrdece", 15: "quìnnece", 16: "sìrice", 17: "dicessette", 18: "diciotto", 19: "dicennove" };
  const T10 = { 2: "vinte", 3: "trenta", 4: "quaranta", 5: "cinquanta", 6: "sissanta", 7: "sittanta", 8: "uttanta", 9: "nuvanta" };
  D.numNap = n => {
    if (SPECIAL[n]) return SPECIAL[n];
    const t = Math.floor(n / 10), u = n % 10;
    if (!u) return T10[t];
    let base = T10[t];
    if (u === 1 || u === 8) base = base.replace(/[ae]$/, "");     // vintuno, trentotto
    if (t === 2 && u !== 1 && u !== 8) base = "vinti";              // vintiddoje, vintitré
    if (t > 2 && u === 2) return base + "ddoje";                    // trentaddoje
    return base + (u === 3 ? "tré" : U[u]);
  };
})(typeof globalThis !== "undefined" ? globalThis : this);

/* Figure illustrate (statuine generate con Google Flow): numeri disponibili in assets/fig/NN.webp */
(function (root) {
  const D = (typeof module !== "undefined" && module.exports) ? module.exports : root.TOMBOLA_DATA;
  D.FIGS = new Set([/*FIGS*/1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90/*/FIGS*/]);
  D.figURL = n => (D.FIGS.has(n) ? `/assets/fig/${String(n).padStart(2, "0")}.webp` : null);
})(typeof globalThis !== "undefined" ? globalThis : this);

/* Detti napoletani (proverbi della tradizione) e scherzi */
(function (root) {
  const D = (typeof module !== "undefined" && module.exports) ? module.exports : root.TOMBOLA_DATA;
  // [napoletano, traduzione]
  D.DETTI = [
    ["Ogne scarrafone è bello 'a mamma soja", "Ogni scarafaggio è bello per la sua mamma"],
    ["Chi tene 'a mamma è ricco e nun 'o sape", "Chi ha la mamma è ricco e non lo sa"],
    ["'A meglia parola è chella ca nun se dice", "La parola migliore è quella che non si dice"],
    ["Ccà nisciuno è fesso", "Qua nessuno è fesso"],
    ["'O pesce fete d' 'a capa", "Il pesce puzza dalla testa"],
    ["Chi nasce tunno nun po' murì quadrato", "Chi nasce tondo non può morire quadrato"],
    ["Ogne capa è 'nu tribunale", "Ogni testa è un tribunale"],
    ["A lavà 'a capa 'o ciuccio se perde l'acqua e 'o sapone", "A lavare la testa all'asino si sprecano acqua e sapone"],
    ["Fa' bene e scuordate, fa' male e pienzace", "Fai il bene e dimenticalo, fai il male e pensaci"],
    ["'E denare fanno venì 'a vista 'e cecate", "I soldi fanno tornare la vista ai ciechi"],
    ["Quanno 'o diavulo t'accarezza, vo' l'anema", "Quando il diavolo ti accarezza, vuole l'anima"],
    ["Chi chiagne fotte a chi ride", "Chi piange frega chi ride"],
    ["'O cane mozzeca 'o stracciato", "Il cane morde lo straccione"],
    ["Tre songo 'e putiente: 'o Papa, 'o Rre e chi nun tene niente", "Tre sono i potenti: il Papa, il Re e chi non ha niente"],
    ["Addò ce sta gusto nun ce sta perdenza", "Dove c'è gusto non c'è perdita"],
    ["Chi pecora se fa, 'o lupo s' 'a magna", "Chi si fa pecora, il lupo se la mangia"],
    ["Pure 'e pullece teneno 'a tosse", "Pure le pulci hanno la tosse"],
    ["Aiutate ca Dio t'aiuta", "Aiutati che Dio ti aiuta"],
    ["'A vita è 'n'affacciata 'e fenesta", "La vita è un'affacciata alla finestra"],
    ["Mazza e panella fanno 'e figlie belle", "Bastone e pane fanno i figli belli"],
    ["Nun sputà 'ncielo ca 'nfaccia te torna", "Non sputare in cielo che ti torna in faccia"],
    ["'O purpo se coce cu ll'acqua soja", "Il polpo si cuoce nella sua acqua"],
    ["Storta va, deritta vene", "Storta va, dritta viene"],
    ["'A gatta, pe' gghì 'e pressa, facette 'e figlie cecate", "La gatta, per la fretta, fece i figli ciechi"],
    ["Dicette 'o pappice vicino 'a noce: damme 'o tiempo ca te spertoso", "Disse il tarlo alla noce: dammi tempo che ti buco"],
    ["Dio te guarde d' 'e ricche appezzentute e d' 'e pezziente arricchute", "Dio ti guardi dai ricchi impoveriti e dai poveri arricchiti"],
    ["'A cera se struje e 'a prucessione nun cammina", "La cera si consuma e la processione non cammina"],
    ["Chi troppo 'a tira, 'a spezza", "Chi troppo la tira, la spezza"],
    ["'O sazio nun crede 'o diuno", "Il sazio non crede a chi digiuna"],
    ["A chi troppo s'acala, 'o culo se vede", "A chi troppo si abbassa, si vede il sedere"],
    ["Meglio 'nu ciuccio vivo ca 'nu duttore muorto", "Meglio un asino vivo che un dottore morto"],
    ["'A carne se jetta e 'e cane s'arraggiano", "La carne si butta e i cani si arrabbiano"],
    ["Chi tene 'a lengua va 'n Sardegna", "Chi ha la lingua arriva in Sardegna"],
    ["'O peggio surdo è chillo ca nun vo' sèntere", "Il peggior sordo è chi non vuol sentire"],
    ["Acqua ca nun cammina fa pantano e fete", "L'acqua che non scorre fa pantano e puzza"],
    ["Ogne bella scarpa addeventa scarpone", "Ogni bella scarpa diventa scarpone"],
    ["'A paura fa nuvanta", "La paura fa novanta"],
    ["Chi nun tene curaggio nun se cocca cu 'e femmene belle", "Chi non ha coraggio non va a letto con le belle donne"],
    ["Quanno 'a gatta nun ce sta, 'e surice abballano", "Quando la gatta non c'è, i topi ballano"],
    ["'E pariente so' comm' 'e scarpe: cchiù so' stritte e cchiù fanno male", "I parenti sono come le scarpe: più sono stretti e più fanno male"]
  ];
  D.detto = (game, k) => D.DETTI[(game * 7 + k * 3) % D.DETTI.length];
  // numeri "dispettosi": quando escono, 'o Munaciello fa uno scherzo a un giocatore a caso
  D.SCHERZO_NUMS = [17, 22, 23, 47, 48, 71, 77, 90];
  D.SCHERZI = [
    "{N} adda fa' 'o verso d' 'o ciuccio! 🫏",
    "{N} deve gridare «Uè uè, guagliù!» a tutta la sala 📣",
    "{N} offre 'o ccafè al vicino di destra ☕",
    "{N} deve fare le corna e dire «Sciò sciò, ciucciuvè!» 🤘",
    "{N} deve dire tre numeri della smorfia a memoria 🔢",
    "{N} gioca il prossimo numero in piedi 🧍",
    "{N} deve mandare un bacio a tutta la tavolata 💋",
    "{N} deve fare un complimento esagerato al banco 🧺",
    "{N} deve imitare Pulcinella per cinque secondi 🎭",
    "{N} deve cantare «tanti auguri» al collega più vicino 🎶",
    "{N} deve fare l'occhiolino a tre persone diverse 😉",
    "{N} deve dire il prossimo numero estratto in napoletano 🗣️"
  ];
  D.PRANKS = {
    sotto: { e: "🙃", name: "Sott'e 'ncoppa", desc: "gli capovolge la cartella" },
    munaciello: { e: "🧙", name: "'O Munaciello", desc: "gli nasconde i numeri" },
    pernacchia: { e: "💨", name: "'A pernacchia", desc: "una bella pernacchia" },
    corna: { e: "🤘", name: "Tiè!", desc: "le corna contro la sua fortuna" }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
