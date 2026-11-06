// ===== Le jeu "Esquive" =====
// Un petit bonhomme doit éviter des boules et des lasers.
// Au bout de 10 secondes, un boss apparaît et tire plus souvent.

const scene = document.querySelector("#scene");
const ctx = scene.getContext("2d");

const affichageTemps = document.querySelector("#temps");
const affichageRecord = document.querySelector("#record");
const finPartie = document.querySelector("#finPartie");
const messageFin = document.querySelector("#messageFin");
const boutonRejouer = document.querySelector("#rejouer");

const largeur = scene.width;
const hauteur = scene.height;

// ---------- 1. Le joueur ----------
let joueur = {
  x: largeur / 2,
  y: hauteur / 2,
  rayon: 14,
  vitesse: 4
};

// Quelles touches sont actuellement enfoncées
let toucheHaut = false;
let toucheBas = false;
let toucheGauche = false;
let toucheDroite = false;

document.addEventListener("keydown", function (evenement) {
  if (evenement.key === "ArrowUp" || evenement.key === "z" || evenement.key === "Z") toucheHaut = true;
  if (evenement.key === "ArrowDown" || evenement.key === "s" || evenement.key === "S") toucheBas = true;
  if (evenement.key === "ArrowLeft" || evenement.key === "q" || evenement.key === "Q") toucheGauche = true;
  if (evenement.key === "ArrowRight" || evenement.key === "d" || evenement.key === "D") toucheDroite = true;
});

document.addEventListener("keyup", function (evenement) {
  if (evenement.key === "ArrowUp" || evenement.key === "z" || evenement.key === "Z") toucheHaut = false;
  if (evenement.key === "ArrowDown" || evenement.key === "s" || evenement.key === "S") toucheBas = false;
  if (evenement.key === "ArrowLeft" || evenement.key === "q" || evenement.key === "Q") toucheGauche = false;
  if (evenement.key === "ArrowRight" || evenement.key === "d" || evenement.key === "D") toucheDroite = false;
});

// Déplace le joueur selon les touches enfoncées
function deplacerJoueur() {
  if (toucheHaut) joueur.y = joueur.y - joueur.vitesse;
  if (toucheBas) joueur.y = joueur.y + joueur.vitesse;
  if (toucheGauche) joueur.x = joueur.x - joueur.vitesse;
  if (toucheDroite) joueur.x = joueur.x + joueur.vitesse;

  // On empêche le joueur de sortir de l'écran
  if (joueur.x < joueur.rayon) joueur.x = joueur.rayon;
  if (joueur.x > largeur - joueur.rayon) joueur.x = largeur - joueur.rayon;
  if (joueur.y < joueur.rayon) joueur.y = joueur.rayon;
  if (joueur.y > hauteur - joueur.rayon) joueur.y = hauteur - joueur.rayon;
}

// ---------- 2. Les boules ----------
// Chaque boule est un objet avec une position (x, y) et une vitesse (vx, vy)
let boules = [];

function creerBoule() {
  // La boule part d'un bord au hasard et se dirige vers le centre
  const bord = nombreAuHasard(0, 3); // 0 = haut, 1 = bas, 2 = gauche, 3 = droite
  let x, y;

  if (bord === 0) { x = nombreAuHasard(0, largeur); y = -20; }
  if (bord === 1) { x = nombreAuHasard(0, largeur); y = hauteur + 20; }
  if (bord === 2) { x = -20; y = nombreAuHasard(0, hauteur); }
  if (bord === 3) { x = largeur + 20; y = nombreAuHasard(0, hauteur); }

  // On calcule la direction vers le centre de l'écran
  const dx = largeur / 2 - x;
  const dy = hauteur / 2 - y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const vitesse = 2;

  boules.push({
    x: x,
    y: y,
    vx: (dx / distance) * vitesse,
    vy: (dy / distance) * vitesse,
    rayon: 9
  });
}

function deplacerBoules() {
  for (let i = 0; i < boules.length; i++) {
    boules[i].x = boules[i].x + boules[i].vx;
    boules[i].y = boules[i].y + boules[i].vy;
  }
}

// ---------- 3. Les lasers ----------
// Un laser est une ligne horizontale ou verticale.
// Il "prévient" pendant 0.5 seconde (en jaune), puis devient dangereux (en rouge) pendant 0.3 seconde.
let lasers = [];

function creerLaser() {
  const vertical = nombreAuHasard(0, 1) === 0;
  lasers.push({
    vertical: vertical,
    position: vertical ? nombreAuHasard(30, largeur - 30) : nombreAuHasard(30, hauteur - 30),
    prevention: 30, // nombre d'images restantes en mode "prévention" (jaune)
    actif: 18        // nombre d'images restantes en mode "dangereux" (rouge), une fois la prévention finie
  });
}

function mettreAJourLasers() {
  for (let i = 0; i < lasers.length; i++) {
    if (lasers[i].prevention > 0) {
      lasers[i].prevention = lasers[i].prevention - 1;
    } else {
      lasers[i].actif = lasers[i].actif - 1;
    }
  }
  // On enlève les lasers terminés (prevention à 0 ET actif à 0 ou moins)
  lasers = lasers.filter(function (laser) {
    return laser.prevention > 0 || laser.actif > 0;
  });
}

// ---------- 4. Le boss ----------
let bossArrive = false;

function declencherBoss() {
  bossArrive = true;
}

// ---------- 5. Dessiner la scène ----------
function dessiner() {
  ctx.clearRect(0, 0, largeur, hauteur);

  // Le joueur
  ctx.fillStyle = "#6fc3a0";
  ctx.beginPath();
  ctx.arc(joueur.x, joueur.y, joueur.rayon, 0, Math.PI * 2);
  ctx.fill();

  // Les boules
  ctx.fillStyle = "#e05a4e";
  for (let i = 0; i < boules.length; i++) {
    ctx.beginPath();
    ctx.arc(boules[i].x, boules[i].y, boules[i].rayon, 0, Math.PI * 2);
    ctx.fill();
  }

  // Les lasers
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    ctx.fillStyle = laser.prevention > 0 ? "rgba(255, 210, 60, 0.5)" : "#ff4040";
    const epaisseur = laser.prevention > 0 ? 4 : 14;

    if (laser.vertical) {
      ctx.fillRect(laser.position - epaisseur / 2, 0, epaisseur, hauteur);
    } else {
      ctx.fillRect(0, laser.position - epaisseur / 2, largeur, epaisseur);
    }
  }

  // Le boss (un gros carré en haut de l'écran)
  if (bossArrive) {
    ctx.fillStyle = "#9b3bd1";
    ctx.fillRect(largeur / 2 - 40, 10, 80, 40);
  }
}

// ---------- 6. Vérifier les collisions (est-ce que le joueur est touché) ----------
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function joueurToucheParUneBoule() {
  for (let i = 0; i < boules.length; i++) {
    if (distance(joueur.x, joueur.y, boules[i].x, boules[i].y) < joueur.rayon + boules[i].rayon) {
      return true;
    }
  }
  return false;
}

function joueurToucheParUnLaser() {
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    if (laser.prevention > 0) continue; // pas encore dangereux

    if (laser.vertical) {
      if (Math.abs(joueur.x - laser.position) < 7 + joueur.rayon) return true;
    } else {
      if (Math.abs(joueur.y - laser.position) < 7 + joueur.rayon) return true;
    }
  }
  return false;
}

// ---------- 7. La boucle du jeu ----------
let enCours = true;
let imagesEcoulees = 0; // compte les images depuis le début de la partie
let record = Number(localStorage.getItem("esquiveRecord")) || 0;
affichageRecord.textContent = record;

function boucleDeJeu() {
  if (!enCours) return;

  imagesEcoulees = imagesEcoulees + 1;
  const secondesEcoulees = Math.floor(imagesEcoulees / 60); // environ 60 images par seconde
  affichageTemps.textContent = secondesEcoulees;

  // Le boss arrive à 10 secondes
  if (secondesEcoulees >= 10 && !bossArrive) {
    declencherBoss();
  }

  // On crée une nouvelle boule toutes les 50 images (plus souvent si le boss est là)
  if (imagesEcoulees % (bossArrive ? 25 : 50) === 0) {
    creerBoule();
  }

  // On crée un nouveau laser toutes les 90 images (plus souvent si le boss est là)
  if (imagesEcoulees % (bossArrive ? 60 : 90) === 0) {
    creerLaser();
  }

  deplacerJoueur();
  deplacerBoules();
  mettreAJourLasers();
  dessiner();

  if (joueurToucheParUneBoule() || joueurToucheParUnLaser()) {
    terminerPartie(secondesEcoulees);
    return;
  }

  requestAnimationFrame(boucleDeJeu);
}

// ---------- 8. Fin de partie ----------
function terminerPartie(secondesEcoulees) {
  enCours = false;

  if (secondesEcoulees > record) {
    record = secondesEcoulees;
    localStorage.setItem("esquiveRecord", record);
    affichageRecord.textContent = record;
    messageFin.textContent = "Nouveau record : " + secondesEcoulees + " secondes !";
  } else {
    messageFin.textContent = "Tu as survécu " + secondesEcoulees + " secondes.";
  }

  finPartie.classList.remove("cache");
}

// ---------- 9. Rejouer ----------
function nombreAuHasard(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function recommencer() {
  joueur.x = largeur / 2;
  joueur.y = hauteur / 2;
  boules = [];
  lasers = [];
  bossArrive = false;
  imagesEcoulees = 0;
  enCours = true;
  finPartie.classList.add("cache");
  requestAnimationFrame(boucleDeJeu);
}

boutonRejouer.addEventListener("click", recommencer);

// On lance la première partie
requestAnimationFrame(boucleDeJeu);
