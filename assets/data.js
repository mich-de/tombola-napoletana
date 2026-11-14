/* Tombola Napoletana – dati: smorfia, avatar, premi.
   Un'idea di Michele De Angelis · mdeangelis.me */
(function (root) {
  // [numero, napoletano, italiano, emoji, storiella]
  const SMORFIA = [
    [1, "L'Italia", "L'Italia", "🇮🇹", "Si parte sempre da casa: il primo numero è per lo Stivale, che a Natale si allarga di due taglie."],
    [2, "'a Criatura", "La bambina", "👧", "La più piccola di casa: è lei che pesca i numeri dal panariello e decide chi vince."],
    [3, "'a Jatta", "La gatta", "🐱", "La gatta di casa guarda la tombola dal divano: aspetta solo che cada un fagiolo per terra."],
    [4, "'o Puorco", "Il maiale", "🐷", "Il maiale porta abbondanza: a Natale, del resto, nessuno si tira indietro davanti al cenone."],
    [5, "'a Mano", "La mano", "✋", "La mano che pesca, la mano che segna, la mano che tiene stretta la cartella fortunata."],
    [6, "Chella ca guarda 'nterra", "Quella che guarda a terra", "🐚", "La figura più discreta della smorfia: tiene gli occhi bassi e fa finta di niente, ma c'è sempre."],
    [7, "'o Vasetto", "Il vaso da notte", "🏺", "Il vaso da notte: oggetto umile di una volta, ma nella smorfia ha il suo posto d'onore."],
    [8, "'a Maronna", "La Madonna", "🙏", "La Madonna protegge tutti i giocatori, anche quelli che barano con i fagioli."],
    [9, "'a Figliata", "La figliolanza", "👨‍👩‍👧‍👦", "La figliata: tutta la famiglia attorno al tavolo, ognuno con la sua cartella e le sue pretese."],
    [10, "'e Fasule", "I fagioli", "🫘", "I fagioli: per secoli sono stati i segnanumeri ufficiali della tombola. Guai a mangiarli prima della fine."],
    [11, "'e Surice", "I topi", "🐭", "I topolini girano attorno al tavolo sperando che qualcuno faccia cadere una fetta di panettone."],
    [12, "'e Surdate", "I soldati", "💂", "Il soldato sta sull'attenti: aspetta il dodici come si aspetta la licenza di Natale."],
    [13, "Sant'Antonio", "Sant'Antonio", "😇", "Sant'Antonio si festeggia il 13 giugno: ma lui ritrova anche le cartelle perse sotto il tavolo."],
    [14, "'o Mbriaco", "L'ubriaco", "🥴", "Arriva sempre al quattordicesimo bicchiere: dice di avere fatto tombola, ma ha la cartella al contrario."],
    [15, "'o Guaglione", "Il ragazzo", "🧒", "Il ragazzo sveglio del vicolo: conosce la smorfia meglio del nonno e lo fa notare a tutti."],
    [16, "'o Culo", "Il deretano", "🍑", "Ci vuole fortuna, e a Napoli la fortuna ha un nome preciso: il sedici!"],
    [17, "'a Disgrazia", "La disgrazia", "😱", "Il diciassette porta sfortuna: chi lo ha in cartella fa le corna sotto il tavolo."],
    [18, "'o Sanghe", "Il sangue", "🩸", "Il sangue di San Gennaro, che si scioglie quando le cose vanno bene. Speriamo anche stasera!"],
    [19, "'a Resata", "Una risata", "😂", "La risata: il vero premio della tombola, quello che si vince sempre e non va spartito."],
    [20, "'a Festa", "La festa", "🎉", "Il venti è la festa: musica, tavola apparecchiata e cartelle pronte."],
    [21, "'a Femmena annura", "La donna nuda", "💃", "La donna senza veli: il ventuno fa sempre arrossire lo zio più timido."],
    [22, "'o Pazzo", "Il pazzo", "🤪", "Il pazzo del quartiere: gioca dieci cartelle insieme e le segna tutte a memoria."],
    [23, "'o Scemo", "Lo sciocco", "🤡", "Lo scemo: chi si distrae e non segna il numero, poi si lamenta che gli manca solo quello."],
    [24, "'e Gguardie", "Le guardie", "👮", "Le guardie controllano che nessuno sposti i fagioli quando il banco si gira."],
    [25, "Natale", "Natale", "🎄", "Il venticinque è Natale! Chi lo ha in cartella ha diritto alla fetta di pandoro più grande."],
    [26, "Nanninella", "Piccola Anna", "👩", "Nanninella, la vicina che sa tutto di tutti e porta sempre gli struffoli."],
    [27, "'o Cantero", "Il pitale", "🚽", "Il pitale: parente stretto del vasetto, sotto il letto della nonna non mancava mai."],
    [28, "'e Zzizze", "Le tette", "🍈", "Il ventotto: quando esce, nonna fa finta di non sentire e chiede il prossimo numero."],
    [29, "'o Pate d''e criature", "Il padre dei bambini", "🍆", "Il ventinove: un numero da uomini, che fa sorridere tutta la tavolata."],
    [30, "'e Palle d''o tenente", "Le palle del tenente", "🍒", "Le palle del tenente: un classico della tombola, chiamato sempre a voce alta."],
    [31, "'o Patrone 'e casa", "Il padrone di casa", "🏠", "Il padrone di casa: offre la cena, ma pretende di vincere almeno un ambo."],
    [32, "'o Capitone", "Il capitone", "🐍", "Il capitone, regina della Vigilia napoletana: scappa dalla bacinella, ma finisce sempre fritto."],
    [33, "Ll'anne 'e Cristo", "Gli anni di Cristo", "✝️", "Trentatré, gli anni di Cristo: il numero più famoso, quello che tutti aspettano di sentire."],
    [34, "'a Capa", "La testa", "🧠", "La testa: quella che serve per seguire tre cartelle insieme senza perdere un numero."],
    [35, "L'Aucelluzz", "L'uccello", "🐦", "L'uccellino sul davanzale porta notizie: dicono che il prossimo numero sia buono."],
    [36, "'e Ccastagnelle", "Le nacchere", "🪇", "Le nacchere della tarantella: quando esce il trentasei, si balla attorno al tavolo."],
    [37, "'o Monaco", "Il monaco", "🧘", "Il monaco: prega in silenzio per l'ambo e non si scompone mai, nemmeno quando lo fa."],
    [38, "'e Mmazzate", "Le botte", "🥊", "Le botte: quelle che volano, per scherzo, quando due vincono la stessa cinquina."],
    [39, "'a Funa 'nganna", "La corda al collo", "🪢", "La corda al collo: quando ti manca un solo numero e il banco non lo chiama mai."],
    [40, "'a Paposcia", "La noia", "🥱", "La noia: quella che non esiste a tombola, finché ti mancano ancora quattordici numeri."],
    [41, "'o Curtiello", "Il coltello", "🔪", "Il coltello che taglia il panettone: le fette devono essere tutte uguali, sennò è guerra."],
    [42, "'o Ccafè", "Il caffè", "☕", "Il caffè: a Napoli si beve sempre, anche a mezzanotte, anche dopo il cenone."],
    [43, "'a Donna 'o barcone", "La donna al balcone", "🪟", "La donna al balcone: vede tutto, sente tutto, e cala il panariello con la corda."],
    [44, "'e Ccancelle", "La prigione", "⛓️", "Il carcere: è dove finisce chi viene scoperto a segnare numeri non ancora usciti."],
    [45, "'o Vino", "Il vino", "🍷", "Il vino: quello buono che lo zio tiene nascosto e tira fuori solo per la tombola."],
    [46, "'e Denare", "Il denaro", "💰", "I soldi: le monetine sul tavolo, il piatto che cresce, la tensione che sale."],
    [47, "'o Muorto", "Il morto", "💀", "Il morto: nella smorfia non fa paura, anzi, quando lo sogni porta numeri buoni."],
    [48, "'o Muorto che parla", "Il morto che parla", "👻", "Il morto che parla: arriva in sogno a suggerire i numeri da giocare. Ascoltalo!"],
    [49, "'o Piezzo 'e carne", "Il pezzo di carne", "🥩", "Il pezzo di carne: quello dell'arrosto di Santo Stefano, che nessuno vuole lasciare."],
    [50, "'o Ppane", "Il pane", "🥖", "Il pane: semplice e buono, e non manca mai sulla tavola della festa."],
    [51, "'o Ciardino", "Il giardino", "🌳", "Il giardino, dove in estate si gioca a tombola sotto il pergolato."],
    [52, "'a Mamma", "La mamma", "🤱", "La mamma: è lei che tiene il cartellone, e nessuno osa contraddirla."],
    [53, "'o Viecchio", "Il vecchio", "👴", "Il vecchio: conosce tutti i numeri a memoria e li chiama prima che escano."],
    [54, "'o Cappiello", "Il cappello", "🎩", "Il cappello: c'era chi ci pescava i numeri dentro, quando il panariello si era rotto."],
    [55, "'a Museca", "La musica", "🎶", "La musica: tammorre e mandolini, perché a Natale si canta anche tra un numero e l'altro."],
    [56, "'a Caruta", "La caduta", "🤕", "La caduta: quella dei fagioli dalla cartella quando qualcuno urta il tavolo. Disastro!"],
    [57, "'o Scartellato", "Il gobbo", "🍀", "Il gobbo porta fortuna: toccargli la gobba, dice la tradizione, fa vincere."],
    [58, "'o Paccotto", "Il regalo", "🎁", "Il pacco: il regalo sotto l'albero. Speriamo che non sia un pacco nel senso napoletano!"],
    [59, "'e Pile", "I peli", "🧔", "I peli: quelli della barba del nonno, che si accarezza mentre aspetta il numero giusto."],
    [60, "Se lamenta", "Il male", "😩", "Se lamenta, chi ha il male: e chi perde dice che le cartelle erano truccate fin dall'inizio."],
    [61, "'o Cacciatore", "Il cacciatore", "🏹", "Il cacciatore: punta il numero come una preda e non lo molla più."],
    [62, "'o Muorto acciso", "Il morto ammazzato", "🗡️", "Il morto ammazzato: un classico dei sogni, da giocare subito al Lotto."],
    [63, "'a Sposa", "La sposa", "👰", "La sposa: bella, emozionata, e con la cartella fortunata dentro la borsetta."],
    [64, "'a Sciammeria", "La marsina", "🤵", "La marsina: l'abito elegante dello sposo, che ovviamente si macchia di sugo."],
    [65, "'o Chianto", "Il pianto", "😭", "Il pianto: di gioia per chi vince, di disperazione per chi aspettava il numero dopo."],
    [66, "'E ddoje zetelle", "Le due zitelle", "👯", "Le due zitelle: sorelle inseparabili, giocano insieme e si spartiscono tutto, ambo compreso."],
    [67, "'o Totaro int''a chitarra", "Il totano", "🦑", "Il totano nella chitarra: nessuno sa perché, ma è uno dei numeri più amati."],
    [68, "'a Zuppa cotta", "La zuppa cotta", "🍲", "La zuppa cotta: calda e saporita, quello che ci vuole nelle sere di dicembre."],
    [69, "Sott'e 'ncoppa", "Sottosopra", "🙃", "Sottosopra: il numero che si legge uguale anche girato. Come la casa dopo il cenone."],
    [70, "'o Palazzo", "Il palazzo", "🏛️", "Il palazzo: quello del vicolo, dove ogni balcone ha la sua tombola accesa."],
    [71, "L'ommo 'e merda", "Uomo di merda", "💩", "L'uomo di poco conto: quello che si presenta al cenone senza portare niente."],
    [72, "'a Meraviglia", "Lo stupore", "😲", "La meraviglia: la faccia di chi fa tombola al primo giro e non ci crede."],
    [73, "'o Spitale", "L'ospedale", "🏥", "L'ospedale: dove si finisce dopo la terza porzione di struffoli."],
    [74, "'a Rotta", "La grotta", "🕳️", "La grotta: come quella del presepe, dove tutto è cominciato."],
    [75, "Pullecenella", "Pulcinella", "🎭", "Pulcinella: la maschera di Napoli, furbo e affamato, che non perde mai una tombola."],
    [76, "'a Funtana", "La fontana", "⛲", "La fontana della piazza, dove ci si dà appuntamento prima della festa."],
    [77, "'e Riavule", "I diavoli", "😈", "I diavoli: si dice anche 'e gambe d'e femmene', perché il 77 sembra un paio di gambe."],
    [78, "'a Bella figliola", "La bella figliola", "💋", "La bella ragazza del quartiere: quando passa, il banco si dimentica di chiamare il numero."],
    [79, "'o Mariuolo", "Il ladro", "🦹", "Il ladro: quello che ruba i fagioli dalla cartella del vicino. Occhio!"],
    [80, "'a Vocca", "La bocca", "👄", "La bocca: quella che chiama i numeri e quella che mangia il panettone. Sempre impegnata."],
    [81, "'e Sciure", "I fiori", "💐", "I fiori: quelli che si portano alla padrona di casa per farsi invitare alla tombola."],
    [82, "'a Tavula 'mbandita", "La tavola imbandita", "🍽️", "La tavola imbandita: ci sono tutti i piatti e, sotto, le cartelle della tombola."],
    [83, "'o Maletiempo", "Il cattivo tempo", "🌧️", "Il maltempo: fuori piove, ma dentro ci sono la tombola e il caldo della famiglia."],
    [84, "'a Chiesa", "La chiesa", "⛪", "La chiesa: dopo la messa di mezzanotte, tutti a casa a giocare."],
    [85, "Ll'aneme 'o priatorio", "L'anima del purgatorio", "🕯️", "Le anime del purgatorio: a Napoli si pregano, e loro ricambiano con i numeri buoni."],
    [86, "'a Puteca", "La bottega", "🏪", "La bottega: quella sotto casa, che a Natale vende torroni e cartelle della tombola."],
    [87, "'e Perucchie", "I pidocchi", "🐜", "I pidocchi: piccoli e fastidiosi, come chi chiede ogni due minuti 'che numero è uscito?'"],
    [88, "'e Casecavalle", "I caciocavalli", "🧀", "I caciocavalli appesi: l'88 sembra proprio due formaggi a forma di pera."],
    [89, "'a Vecchia", "La vecchia", "👵", "La vecchia: la nonna che vince sempre la tombola, e nessuno ha mai capito come."],
    [90, "'a Paura", "La paura", "😨", "Novanta, la paura: l'ultimo numero, quello che fa tremare tutti. La paura fa novanta!"]
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

  const CREDITS = { author: "Michele De Angelis", site: "mdeangelis.me", url: "https://mdeangelis.me", version: "1.0.0", year: 2026 };

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
    "'A paposcia: chesta tombola è cchiù longa 'e na messa cantata!",
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
