// ===== Casino Mortel : le cerveau du jeu =====

// ---------- 1. L'état du jeu ----------
// Tout ce qu'on doit retenir : l'argent et les membres qu'il reste.
const NOMS_MEMBRES = {
  brasG: "bras gauche",
  brasD: "bras droit",
  jambeG: "jambe gauche",
  jambeD: "jambe droite"
};

function nouvellePartie() {
  return {
    argent: 100,
    membres: { brasG: true, brasD: true, jambeG: true, jambeD: true },
    mort: false
  };
}

let etat = charger();
let occupe = false; // true pendant une animation (empêche de spammer les boutons)

// ---------- 2. Sauvegarde (localStorage) ----------
function sauvegarder() {
  try {
    localStorage.setItem("casinoMortel", JSON.stringify(etat));
  } catch (e) {
    console.log("Sauvegarde impossible", e);
  }
}

function charger() {
  try {
    const texte = localStorage.getItem("casinoMortel");
    if (texte) return JSON.parse(texte);
  } catch (e) {
    console.log("Chargement impossible", e);
  }
  return nouvellePartie();
}

// ---------- 3. On retrouve les éléments de la page ----------
const affichageArgent = document.querySelector("#argent");
const message = document.querySelector("#message");
const champMise = document.querySelector("#mise");
const historique = document.querySelector("#historique");
const perso = document.querySelector("#perso");
const visage = document.querySelector("#visage");
const etatMembres = document.querySelector("#etat-membres");
const zoneJeux = document.querySelector("#zone-jeux");
const zoneMembre = document.querySelector("#zone-membre");
const zoneFin = document.querySelector("#zone-fin");
const texteFin = document.querySelector("#texte-fin");

// ---------- 4. Petites fonctions utiles ----------
function ecrire(texte) {
  message.textContent = texte;
  const ligne = document.createElement("li");
  ligne.textContent = texte;
  historique.prepend(ligne); // on ajoute en haut de la liste
}

function nombreAuHasard(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pause(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function membresRestants() {
  return Object.keys(etat.membres).filter(function (nom) { return etat.membres[nom]; });
}

// Lit la mise du joueur. Renvoie null si elle n'est pas valide.
function lireMise() {
  const mise = parseInt(champMise.value, 10);
  if (isNaN(mise) || mise < 1) {
    message.textContent = "Entre une mise d'au moins 1 €.";
    return null;
  }
  if (mise > etat.argent) {
    message.textContent = "Tu n'as pas assez d'argent pour cette mise !";
    return null;
  }
  return mise;
}

// Change l'humeur du personnage un petit moment
function humeur(emoji, classe) {
  visage.textContent = emoji;
  perso.classList.add(classe);
  setTimeout(function () {
    perso.classList.remove(classe);
    afficher();
  }, 900);
}

// ---------- 5. Affichage : met la page à jour selon l'état ----------
function afficher() {
  affichageArgent.textContent = etat.argent;

  // On cache les membres perdus
  for (const nom in etat.membres) {
    const morceau = document.querySelector("#" + nom);
    morceau.classList.toggle("perdu", !etat.membres[nom]);
  }

  const restants = membresRestants();
  etatMembres.textContent = "Membres restants : " + restants.length + " / 4";

  // Visage selon la situation
  if (etat.mort) visage.textContent = "💀";
  else if (etat.argent <= 0) visage.textContent = "😰";
  else if (restants.length < 4) visage.textContent = "😬";
  else visage.textContent = "😎";

  // Quels blocs montrer ?
  const fauche = etat.argent < 1;
  zoneJeux.classList.toggle("cache", fauche || etat.mort);
  zoneMembre.classList.toggle("cache", !fauche || etat.mort);
  zoneFin.classList.toggle("cache", !etat.mort);

  sauvegarder();
}

// ---------- 6. Résultat d'une partie ----------
// gain = true si le joueur gagne, "profit" = ce qu'il gagne en plus de sa mise
function finDePartie(gagne, mise, profit, texte) {
  if (gagne) {
    etat.argent = etat.argent + profit;
    ecrire("✅ " + texte + " Tu gagnes " + profit + " € !");
    humeur("🤑", "gagne");
  } else {
    etat.argent = etat.argent - mise;
    ecrire("❌ " + texte + " Tu perds " + mise + " € !");
    humeur("😭", "tremble");
  }
  verifierMort();
  afficher();
  occupe = false;
}

// Mort = plus d'argent ET plus aucun membre à parier
function verifierMort() {
  if (etat.argent < 1 && membresRestants().length === 0) {
    etat.mort = true;
    texteFin.textContent = "Plus d'argent, plus de membres... Le casino gagne toujours. Fin de la partie.";
  }
}

// ---------- 7. Jeu 1 : pile ou face ----------
async function jouerPileOuFace(choix) {
  if (occupe) return;
  const mise = lireMise();
  if (mise === null) return;
  occupe = true;

  const piece = document.querySelector("#piece");
  piece.classList.add("tourne");
  message.textContent = "La pièce tourne...";
  await pause(800);
  piece.classList.remove("tourne");

  const resultat = nombreAuHasard(0, 1) === 0 ? "pile" : "face";
  piece.textContent = resultat === "pile" ? "🪙" : "👑";
  finDePartie(resultat === choix, mise, mise, "C'est " + resultat + " !");
}

// ---------- 8. Jeu 2 : le dé en 3D ----------
// Pour montrer la bonne face, on tourne le cube.
const ROTATIONS_DE = {
  1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0]
};
let toursDe = 0; // on ajoute des tours complets pour que le dé "roule"

async function jouerDe() {
  if (occupe) return;
  const mise = lireMise();
  if (mise === null) return;
  occupe = true;

  const choix = parseInt(document.querySelector("#choix-de").value, 10);
  const resultat = nombreAuHasard(1, 6);

  toursDe = toursDe + 2;
  const x = ROTATIONS_DE[resultat][0] + 360 * toursDe;
  const y = ROTATIONS_DE[resultat][1] + 360 * toursDe;
  document.querySelector("#de").style.transform = "rotateX(" + x + "deg) rotateY(" + y + "deg)";

  message.textContent = "Le dé roule...";
  await pause(1400);

  finDePartie(resultat === choix, mise, mise * 4, "Le dé affiche " + resultat + ".");
}

// ---------- 9. Jeu 3 : la roulette ----------
const ROUGES = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

function couleurDuNumero(n) {
  if (n === 0) return "zero";
  return ROUGES.includes(n) ? "rouge" : "noir";
}

async function jouerRoulette(choix) {
  if (occupe) return;
  const mise = lireMise();
  if (mise === null) return;
  occupe = true;

  const roue = document.querySelector("#roue");
  const numero = document.querySelector("#numero");
  roue.classList.add("tourne");
  message.textContent = "Rien ne va plus...";

  // On affiche des numéros au hasard pour l'effet, puis le vrai résultat
  for (let i = 0; i < 12; i++) {
    numero.textContent = nombreAuHasard(0, 36);
    await pause(110);
  }
  roue.classList.remove("tourne");

  const resultat = nombreAuHasard(0, 36);
  numero.textContent = resultat;
  const couleur = couleurDuNumero(resultat);

  const gagne = couleur === choix;
  const profit = choix === "zero" ? mise * 14 : mise;
  finDePartie(gagne, mise, profit, "La bille s'arrête sur le " + resultat + " (" + couleur + ").");
}

// ---------- 10. Le pari des membres ----------
// Quand on n'a plus d'argent : pile ou face, on mise un membre.
// Gagné : +100 €. Perdu : le casino garde un membre.
async function parierMembre() {
  if (occupe) return;
  const restants = membresRestants();
  if (restants.length === 0) return;
  occupe = true;

  const membreMise = restants[nombreAuHasard(0, restants.length - 1)];
  message.textContent = "Tu mises ton " + NOMS_MEMBRES[membreMise] + "... la pièce tourne !";
  await pause(1000);

  if (nombreAuHasard(0, 1) === 0) {
    etat.argent = etat.argent + 100;
    ecrire("😅 Tu gagnes ! +100 € et tu gardes ton " + NOMS_MEMBRES[membreMise] + ".");
    humeur("🤑", "gagne");
  } else {
    etat.membres[membreMise] = false;
    ecrire("💥 Perdu ! Le casino garde ton " + NOMS_MEMBRES[membreMise] + ".");
    humeur("😱", "tremble");
  }
  verifierMort();
  afficher();
  occupe = false;
}

// ---------- 11. Rejouer ----------
function rejouer() {
  etat = nouvellePartie();
  historique.innerHTML = "";
  message.textContent = "Nouvelle partie ! Tu as 100 €.";
  occupe = false;
  afficher();
}

// ---------- 12. On branche les boutons ----------
document.querySelector("#btn-pile").addEventListener("click", function () { jouerPileOuFace("pile"); });
document.querySelector("#btn-face").addEventListener("click", function () { jouerPileOuFace("face"); });
document.querySelector("#btn-de").addEventListener("click", jouerDe);
document.querySelector("#btn-rouge").addEventListener("click", function () { jouerRoulette("rouge"); });
document.querySelector("#btn-noir").addEventListener("click", function () { jouerRoulette("noir"); });
document.querySelector("#btn-zero").addEventListener("click", function () { jouerRoulette("zero"); });
document.querySelector("#btn-membre").addEventListener("click", parierMembre);
document.querySelector("#btn-rejouer").addEventListener("click", rejouer);

// Les onglets : montrent un seul jeu à la fois
document.querySelectorAll(".onglet").forEach(function (bouton) {
  bouton.addEventListener("click", function () {
    document.querySelectorAll(".onglet").forEach(function (b) { b.classList.remove("actif"); });
    bouton.classList.add("actif");
    document.querySelectorAll(".jeu").forEach(function (j) { j.classList.add("cache"); });
    document.querySelector("#jeu-" + bouton.dataset.jeu).classList.remove("cache");
  });
});

// Au chargement de la page
afficher();
