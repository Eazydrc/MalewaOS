"use strict";

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, WidthType,
  ShadingType, VerticalAlign
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── helpers ────────────────────────────────────────────────────────────────

const FONT = "Arial";
const CONTENT_WIDTH = 9360; // US Letter – 1 in margins each side (12240 – 2*1440)

// Border style reused for every table cell
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = {
  top: cellBorder, bottom: cellBorder,
  left: cellBorder, right: cellBorder,
};
const CELL_MARGINS = { top: 80, bottom: 80, left: 120, right: 120 };

function p(text, opts = {}) {
  return new Paragraph({
    ...opts,
    children: [new TextRun({ text, font: FONT, size: opts.size || 22, bold: opts.bold || false, color: opts.color || "000000" })],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: FONT, size: 32, bold: true, color: "1F3864" })],
    spacing: { before: 360, after: 180 },
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: "2E4A7A" })],
    spacing: { before: 240, after: 120 },
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}

function spacer() {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: 60, after: 60 } });
}

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "E5E7EB", type: ShadingType.CLEAR },
    margins: CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT, size: 22, bold: true })],
    })],
  });
}

function dataCell(text, width, shaded = false) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: shaded ? "F9FAFB" : "FFFFFF", type: ShadingType.CLEAR },
    margins: CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT, size: 22 })],
    })],
  });
}

// ── Table: couleurs par pack ───────────────────────────────────────────────

function colorPackTable() {
  const colWidths = [2600, 2400, 4360]; // sum = 9360
  const headers = ["Pack", "Couleur", "Code hex"];
  const rows = [
    ["DECOUVERTE", "Gris", "#9CA3AF"],
    ["MAMAN", "Vert", "#22C55E"],
    ["ESSENTIEL", "Bleu", "#3B82F6"],
    ["CROISSANCE", "Violet", "#8B5CF6"],
    ["DOMINATION", "Or", "#F59E0B"],
  ];

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => headerCell(h, colWidths[i])),
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => dataCell(cell, colWidths[ci], ri % 2 === 1)),
      })),
    ],
  });
}

// ── Table: composants clés ─────────────────────────────────────────────────

function composantsTable() {
  const colWidths = [2200, 4300, 2860]; // sum = 9360
  const headers = ["Composant", "Description", "Variantes"];
  const rows = [
    ["Card restaurant", "Photo + nom + cuisine + distance + rating + statut", "Hero / Standard / Compact"],
    ["Card plat du jour", "Photo + badge + countdown + prix", "Avec/sans promo"],
    ["Badge pack", "Couleur par tier", "DECOUVERTE / MAMAN / ESSENTIEL / CROISSANCE / DOMINATION"],
    ["Modal reservation", "Date picker + nb personnes + notes", "Mobile / Desktop"],
    ["Chip filtre", "Cuisine, type, statut", "Actif / Inactif"],
    ["Pin map", "Couleur selon type restaurant", "Sur place / Livraison / Les deux"],
    ["Bottom sheet", "Drawer draggable", "Collapsed / Half / Full"],
    ["Countdown timer", "Jours restants plat du jour", "Normal / Urgent (rouge < 3j)"],
  ];

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => headerCell(h, colWidths[i])),
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => dataCell(cell, colWidths[ci], ri % 2 === 1)),
      })),
    ],
  });
}

// ── Document assembly ──────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 22 },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1",
        basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 32, bold: true, color: "1F3864" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2",
        basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 26, bold: true, color: "2E4A7A" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
    ],
  },

  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },

  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: [

      // ── Titre & sous-titre ──────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({
          text: "Elengi — Prompt Design pour Claude Design / Figma AI",
          font: FONT, size: 40, bold: true, color: "E85D26",
        })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 480 },
        children: [new TextRun({
          text: "Brief complet · Version 1.0 · Mai 2026",
          font: FONT, size: 24, italics: true, color: "555555",
        })],
      }),

      // ── SECTION 1 ──────────────────────────────────────────────────────
      heading1("Section 1 : Contexte du projet"),
      p("Elengi est une application mobile-first de reservation et fidelite pour restaurants a Kinshasa, RDC. L'application existe en deux faces : une pour les restaurateurs (dashboard de gestion) et une pour les clients (decouverte, reservation, commande en ligne)."),
      spacer(),
      p("Stack technique frontend : React + Vite + TailwindCSS. CSS variables pour theming. Dark mode supporte nativement."),
      spacer(),

      // ── SECTION 2 ──────────────────────────────────────────────────────
      heading1("Section 2 : Identite visuelle"),

      heading2("Couleurs actuelles"),
      bullet("Brand orange : #E85D26"),
      bullet("Fond sombre : #1A1A1A"),
      bullet("Surface : #242424"),
      bullet("Texte principal : #F5F5F5"),
      spacer(),

      heading2("Couleurs par pack (badges)"),
      colorPackTable(),
      spacer(),

      heading2("References visuelles"),
      p("Moderne, chaud, ancre en Afrique centrale. Pas folklorique — elegant et urbain comme une app internationale mais avec une ame africaine. References : Glovo (clarte cards), Airbnb (confiance + storytelling), avec la chaleur d'un marche kinois."),
      spacer(),

      // ── SECTION 3 ──────────────────────────────────────────────────────
      heading1("Section 3 : Pages a designer"),
      p("Chaque page doit etre designee en version mobile ET desktop."),
      spacer(),

      heading2("3.1 Homepage client"),
      bullet("Header : logo + barre recherche + icone profil"),
      bullet("Section hero : « Trouvez votre table a Kinshasa » avec search bar geolocalisee"),
      bullet("Carousel horizontal « Plats du jour » → cards plat avec photo, nom, restaurant, prix, badge « Aujourd'hui seulement »"),
      bullet("Carousel « Offres & Promos » → cards avec badge reduction % ou points"),
      bullet("Section « Restaurants populaires » → grid cards avec photo, nom, cuisine, distance, rating etoiles, statut ouvert/ferme"),
      bullet("Bottom nav : Accueil / Recherche / Reservations / Profil"),
      spacer(),

      heading2("3.2 Page recherche avec map GPS"),
      bullet("Toggle vue Map / vue Liste"),
      bullet("Map plein ecran avec pins restaurants colores par type (sur place / livraison / les deux)"),
      bullet("Sheet drawer bas draggable qui liste les restaurants en cards compactes"),
      bullet("Filtres chips horizontal : Cuisine + Type + Ouvert maintenant + Distance"),
      spacer(),

      heading2("3.3 Profil public restaurant (vue client)"),
      bullet("Hero image plein largeur avec overlay gradient bas"),
      bullet("Badge cuisine + type + rating + statut ouvert"),
      bullet("Infos rapides : adresse structuree, telephone, distance"),
      bullet("Tabs : Menu / Offres / Avis"),
      bullet("Dans le menu : sections categorisees, items avec photo, prix, badge plat du jour"),
      bullet("Bouton sticky bas « Reserver une table » → modal reservation"),
      spacer(),

      heading2("3.4 Dashboard restaurateur"),
      bullet("Sidebar desktop / bottom nav mobile"),
      bullet("Cards KPI : reservations aujourd'hui, commandes en cours, revenus semaine, rating"),
      bullet("Countdown « Plats du jour restants ce mois » avec barre progression (ex : 7/10 jours)"),
      bullet("Feed live : dernieres reservations + commandes avec statut colore"),
      bullet("Badge pack actuel avec CTA upgrade"),
      spacer(),

      heading2("3.5 Page publique DOMINATION (restaurant fully branded)"),
      bullet("Page entierement aux couleurs du restaurant (primaryColor, accentColor)"),
      bullet("Hero plein ecran : image + tagline + CTA « Voir le menu »"),
      bullet("Section « Notre histoire » : texte + photo ambiance"),
      bullet("Galerie photos grid masonry"),
      bullet("Menu avec police custom du restaurant"),
      bullet("QR code aux couleurs du restaurant dans frame brande"),
      spacer(),

      // ── SECTION 4 ──────────────────────────────────────────────────────
      heading1("Section 4 : Composants cles a designer"),
      composantsTable(),
      spacer(),

      // ── SECTION 5 ──────────────────────────────────────────────────────
      heading1("Section 5 : Contraintes techniques"),
      bullet("Mobile-first, breakpoint desktop : 1024px"),
      bullet("Dark mode natif obligatoire"),
      bullet("Accessibilite : contraste minimum WCAG AA"),
      bullet("Pas d'illustrations generiques — photos reelles ou placeholders photo-realistes"),
      bullet("Animations : transitions douces 200ms, pas d'animations lourdes"),
      bullet("Touch targets minimum : 44×44px"),
      bullet("Langue principale : Francais (quelques elements en Lingala possible pour l'identite locale)"),
      spacer(),

      // ── SECTION 6 ──────────────────────────────────────────────────────
      heading1("Section 6 : Flux utilisateur prioritaires a couvrir"),
      numbered("Decouverte → Recherche par cuisine → Profil restaurant → Reservation"),
      numbered("Homepage → Plat du jour → Profil restaurant → Menu → Commande"),
      numbered("Restaurateur → Dashboard → Activer plat du jour → Voir countdown"),
      numbered("Restaurateur DOMINATION → Personnaliser design → Previsualiser page publique"),
      spacer(),

    ],
  }],
});

// ── Write file ─────────────────────────────────────────────────────────────

const OUT = path.join(__dirname, "Elengi_Design_Prompt.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT, buffer);
  const sizeKB = Math.round(buffer.length / 1024);
  console.log(`[OK] Document genere : ${OUT}`);
  console.log(`     Taille : ${sizeKB} KB`);
}).catch((err) => {
  console.error("[ERREUR]", err);
  process.exit(1);
});
