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

  // La vitesse des boules augmente avec le temps : le jeu devient de plus en plus dur
  const secondesEcoulees = Math.floor(imagesEcoulees / 60);
  const vitesse = 2 + secondesEcoulees * 0.12;

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

// Le boss est une grosse tête de Pacman énervée qui poursuit le joueur
let boss = {
  x: largeur / 2,
  y: 50,
  rayon: 30,
  vitesse: 1.6, // sa vitesse de départ, elle augmentera ensuite avec le temps
  boucheOuverte: 0 // sert juste à faire bouger la bouche pour l'animation
};

function declencherBoss() {
  bossArrive = true;
}

// Les lasers que le boss tire vers le joueur
let tirsBoss = [];

function bossTire() {
  const dx = joueur.x - boss.x;
  const dy = joueur.y - boss.y;
  const distanceAuJoueur = Math.sqrt(dx * dx + dy * dy);
  const vitesse = 5;

  tirsBoss.push({
    x: boss.x,
    y: boss.y,
    vx: (dx / distanceAuJoueur) * vitesse,
    vy: (dy / distanceAuJoueur) * vitesse,
    rayon: 6
  });
}

function deplacerTirsBoss() {
  for (let i = 0; i < tirsBoss.length; i++) {
    tirsBoss[i].x = tirsBoss[i].x + tirsBoss[i].vx;
    tirsBoss[i].y = tirsBoss[i].y + tirsBoss[i].vy;
  }
  // On enlève les tirs qui sont sortis de l'écran, pour ne pas garder des objets inutiles
  tirsBoss = tirsBoss.filter(function (tir) {
    return tir.x > -30 && tir.x < largeur + 30 && tir.y > -30 && tir.y < hauteur + 30;
  });
}

// Fait avancer le boss vers le joueur, un petit pas à la fois
function deplacerBoss() {
  if (!bossArrive) return;

  // Le boss devient de plus en plus rapide, plus la partie dure
  const secondesEcoulees = Math.floor(imagesEcoulees / 60);
  boss.vitesse = 1.6 + secondesEcoulees * 0.05;

  const dx = joueur.x - boss.x;
  const dy = joueur.y - boss.y;
  const distanceAuJoueur = Math.sqrt(dx * dx + dy * dy);

  // On avance seulement si on n'est pas déjà collé au joueur, pour ne pas diviser par zéro
  if (distanceAuJoueur > 1) {
    boss.x = boss.x + (dx / distanceAuJoueur) * boss.vitesse;
    boss.y = boss.y + (dy / distanceAuJoueur) * boss.vitesse;
  }

  boss.boucheOuverte = boss.boucheOuverte + 1;
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

  // Les lasers tirés par le boss
  ctx.fillStyle = "#ff3b3b";
  for (let i = 0; i < tirsBoss.length; i++) {
    ctx.beginPath();
    ctx.arc(tirsBoss[i].x, tirsBoss[i].y, tirsBoss[i].rayon, 0, Math.PI * 2);
    ctx.fill();
  }

  // Le boss : une tête de Pacman énervée
  if (bossArrive) {
    dessinerBoss();
  }
}

function dessinerBoss() {
  // La bouche s'ouvre et se ferme avec le temps, entre 0.08 et 0.45 radian
  const ouverture = 0.08 + (Math.sin(boss.boucheOuverte / 6) + 1) / 2 * 0.37;

  // On calcule la direction vers le joueur, pour que la bouche soit orientée vers lui
  const angleVersJoueur = Math.atan2(joueur.y - boss.y, joueur.x - boss.x);

  // Le corps jaune, avec la bouche ouverte vers le joueur
  ctx.fillStyle = "#ffd23f";
  ctx.beginPath();
  ctx.moveTo(boss.x, boss.y);
  ctx.arc(boss.x, boss.y, boss.rayon, angleVersJoueur + ouverture, angleVersJoueur - ouverture, false);
  ctx.closePath();
  ctx.fill();

  // Un contour pour le détacher du fond
  ctx.strokeStyle = "#8a6a00";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Un oeil, du côté opposé à la bouche
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(boss.x - Math.cos(angleVersJoueur) * 10, boss.y - 14, 4, 0, Math.PI * 2);
  ctx.fill();

  // Sourcils froncés, pour l'air énervé
  ctx.strokeStyle = "#8a1a1a";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(boss.x - 18, boss.y - 22);
  ctx.lineTo(boss.x - 4, boss.y - 14);
  ctx.moveTo(boss.x + 18, boss.y - 22);
  ctx.lineTo(boss.x + 4, boss.y - 14);
  ctx.stroke();
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

function joueurToucheParLeBoss() {
  if (!bossArrive) return false;
  return distance(joueur.x, joueur.y, boss.x, boss.y) < joueur.rayon + boss.rayon;
}

function joueurToucheParUnTirDeBoss() {
  for (let i = 0; i < tirsBoss.length; i++) {
    if (distance(joueur.x, joueur.y, tirsBoss[i].x, tirsBoss[i].y) < joueur.rayon + tirsBoss[i].rayon) {
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

  // Le nombre d'images entre deux apparitions diminue avec le temps : ça arrive de plus en plus souvent.
  // On garde un minimum (10 et 20) pour que ça reste jouable un minimum, même si ça devient très dur.
  let intervalleBoules = Math.max(10, 50 - secondesEcoulees * 1.5);
  let intervalleLasers = Math.max(20, 90 - secondesEcoulees * 2);

  // Une fois le boss arrivé, tout devient encore plus fréquent
  if (bossArrive) {
    intervalleBoules = intervalleBoules / 2;
    intervalleLasers = intervalleLasers / 1.5;
  }

  if (imagesEcoulees % Math.round(intervalleBoules) === 0) {
    creerBoule();
  }

  if (imagesEcoulees % Math.round(intervalleLasers) === 0) {
    creerLaser();
  }

  // Le boss tire un laser toutes les 70 images, environ une fois par seconde
  if (bossArrive && imagesEcoulees % 70 === 0) {
    bossTire();
  }

  deplacerJoueur();
  deplacerBoules();
  mettreAJourLasers();
  deplacerBoss();
  deplacerTirsBoss();
  dessiner();

  if (
    joueurToucheParUneBoule() ||
    joueurToucheParUnLaser() ||
    joueurToucheParLeBoss() ||
    joueurToucheParUnTirDeBoss()
  ) {
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
  tirsBoss = [];
  bossArrive = false;
  boss.x = largeur / 2;
  boss.y = 50;
  imagesEcoulees = 0;
  enCours = true;
  finPartie.classList.add("cache");
  requestAnimationFrame(boucleDeJeu);
}

boutonRejouer.addEventListener("click", recommencer);

// On lance la première partie
requestAnimationFrame(boucleDeJeu);
